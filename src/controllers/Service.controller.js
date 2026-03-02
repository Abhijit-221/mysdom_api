
const { validationResult } = require('express-validator');
const { ResponseCodes } = require('../utils/constant');
const Service = require('../models/ServiceSchema');
module.exports = {
    /*
    * @route POST /api/v1/mysdom/service/add
    * @desc Add a new service
    * @authentication  true [admin]
    */
    addService: async (req, res) => {
        console.log('Add Service API.....');
        try {
            const validationErrors = validationResult(req);
            if (!validationErrors.isEmpty()) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    errors: validationErrors.array(),
                    message: 'Validation failed'
                });
            }
            const { name, description } = req.body;
            //let check if service with same name already exists
            const existingService = await Service.findOne({ name: name });
            if (existingService) {
                return res.status(ResponseCodes.CONFLICT).json({
                    status: ResponseCodes.CONFLICT,
                    data: {},
                    error: 'Service with same name already exists',
                    message: 'Service with same name already exists'
                });
            }
            //let create new service
            const newService = new Service({
                name,
                description,
                createdBy: req.user._id
            });
            await newService.save();
            return res.status(ResponseCodes.CREATED).json({
                status: ResponseCodes.CREATED,
                data: newService,
                message: 'Service added successfully'
            });
        }
        catch (error) {
            console.error('Error in Add Service:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },
    /*
    * @route GET /api/v1/mysdom/service/list
    * @desc Get list of all services
    * @authentication  true [admin, user]  
    * @queryParams page, limit, search
    * 
    */
    getServiceList: async (req, res) => {
        console.log('Get Service List API.....');
        try {
            let { page, limit, search } = req.query;
            page = page || 1;
            limit = limit || 10;
            let skip = (page - 1) * limit;
            
            const query = {
                is_deleted: false,
                
            };
            if(!['admin','superadmin'].includes(req.user.role)){
                query.isActive=true
            }
            if(search){
                query.name = { $regex: search, $options: 'i' };
            }
            const services = await Service.find(query).skip(skip).limit(limit);
            const count = await Service.countDocuments(query);
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: {
                    services,
                    count,
                },
                message: 'Service list fetched successfully'
            });
        }
        catch (error) {
            console.error('Error in Get Service List:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },
    /*
    * @route PUT /api/v1/mysdom/service/update
    * @desc Update a service
    * @authentication  true [admin]
    */
   updateService: async (req, res) => {
        console.log('Update Service API.....');
        try {
            const validationErrors = validationResult(req);
            if (!validationErrors.isEmpty()) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    errors: validationErrors.array(),
                    message: 'Validation failed'
                });
            }
            const { id, name,isActive, description } = req.body;
            //let check service on that id already exist or not
            const checkService  = await Service.findOne({_id:id,is_deleted:false});
            if(!checkService){
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status:ResponseCodes.NOT_FOUND,
                    data:{},
                    error:"Service not found, invalid service id",
                    message:"Service not found"
                })
            }
            //let check if service with same name already exists
            if(name){
                const existingService = await Service.findOne({ name: name,is_deleted:false, _id: { $ne: id } });
                if (existingService) {
                    return res.status(ResponseCodes.CONFLICT).json({
                        status: ResponseCodes.CONFLICT,
                        data: {},
                        error: 'Service with same name already exists',
                        message: 'Service with same name already exists'
                    });
                }
            }
            //let update service
            let updateData = {
                updatedBy: req.user._id,
                ...name && { name },
                ...description && { description },
                ...isActive !== undefined && { isActive }
            }
            console.log('updateData:', updateData);
            const updatedService = await Service.findByIdAndUpdate(
                id,
                updateData,
                {new:true}
            );
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: updatedService,
                message: 'Service updated successfully'
            });
        }
        catch (error) {
            console.error('Error in Update Service:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },
    /*
    * @route GET /api/v1/mysdom/service/:id
    * @desc GET a service
    * @authentication  true [admin]
    */
    getServiceById: async (req, res) => {
        console.log('Get Service By Id API.....');
        try {
            const { id } = req.params;
            let extracondition = {};
            if(req.user.role === 'user'){
                extracondition = { isActive: true }
            }
            const service = await Service.findOne({
                _id: id,
                is_deleted: false,
                ...extracondition
            });
            if (!service) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    message: 'Service not found'
                });
            }
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: service,
                message: 'Service fetched successfully'
            });
        }
        catch (error) {
            console.error('Error in Get Service By Id:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },
    /*
    * @route GET /api/v1/mysdom/services/
    * @desc GET a service
    * @authentication  true [admin]
    */
   getServices: async(req,res)=>{
    console.log('Get service api...');
    try{
        //let find the services
        let services = await Service.find({
            is_deleted:false,
            isActive:true
        });
        return res.status(ResponseCodes.SUCCESS).json({
            status:ResponseCodes.SUCCESS,
            data:services,
            error:{},
            message:"Services fetched"
        })
    }
    catch(error){
        console.log('Internal server error:',error);
        return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
    }
   }

}