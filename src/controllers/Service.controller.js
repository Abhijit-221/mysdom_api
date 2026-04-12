
const { validationResult } = require('express-validator');
const { ResponseCodes } = require('../utils/constant');
const Service = require('../models/ServiceSchema');
const { Op } = require('sequelize');
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
            const { name, description, moredetails } = req.body;
            //let check if service with same name already exists
            const existingService = await Service.findOne({
                where: {
                    name: name,
                }
            });
            if (existingService) {
                return res.status(ResponseCodes.CONFLICT).json({
                    status: ResponseCodes.CONFLICT,
                    data: {},
                    error: 'Service with same name already exists',
                    message: 'Service with same name already exists'
                });
            }
            //let create new service
            const newService = {
                name,
                description,
                moredetails,
                createdBy: req.user.id,
                updatedBy: req.user.id
            };
            const createdService = await Service.create(newService);
            return res.status(ResponseCodes.CREATED).json({
                status: ResponseCodes.CREATED,
                data: createdService,
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

            let query = {
               
            };
            if (!['admin', 'superadmin'].includes(req.user.role)) {
                query.isActive = true
            }
            if (search) {
                query = {
                    ...query,
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { description: { [Op.like]: `%${search}%` } }
                    ]
                };
            }
            const services = await Service.findAll({
                where: query,
                offset: skip,
                limit: parseInt(limit),
                order: [['createdAt', 'DESC']],
                raw: true
            },
            );
            const count = await Service.count({
                where: query
            });
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
    * @route GET /api/v1/mysdom/service/ext-list
    * @desc Get list of all services
    * @authentication  true [admin, user]  
    * @queryParams page, limit, search
    * 
    */
    getServiceListForExt: async (req, res) => {
        console.log('Get Service List API.....');
        try {
            let { page, limit, search } = req.query;
            page = page || 1;
            limit = limit || 10;
            let skip = (page - 1) * limit;

            let query = {
               isActive : true
            };
            // if (!['admin', 'superadmin'].includes(req.user.role)) {
            //     query.isActive = true
            // }
            if (search) {
                query = {
                    ...query,
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { description: { [Op.like]: `%${search}%` } }
                    ]
                };
            }
            const services = await Service.findAll({
                where: query,
                offset: skip,
                limit: parseInt(limit),
                order: [['createdAt', 'DESC']],
                raw: true
            },
            );
            const count = await Service.count({
                where: query
            });
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
            const { id, name, isActive, description,moredetails } = req.body;
            //let check service on that id already exist or not
            const checkService = await Service.findOne({ where: { id: id} });
            if (!checkService) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: "Service not found, invalid service id",
                    message: "Service not found"
                })
            }
            //let check if service with same name already exists
            if (name) {
                const existingService = await Service.findOne({where: { name: name, id: { [Op.ne]: id } }});
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
                updatedBy: req.user.id,
                ...name && { name },
                ...description && { description },
                ...moredetails && { moredetails },
                ...isActive !== undefined && { isActive }
            }
            console.log('updateData:', updateData);
            await Service.update(
                updateData,
                { where: { id: id } }
            );
            const updatedService = await Service.findOne({ where: { id: id }, raw: true });
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
            if (req.user.role === 'user') {
                extracondition = { isActive: true }
            }
            const service = await Service.findOne({
                where: {
                    id: id,
                    ...extracondition
                }
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
    getServices: async (req, res) => {
        console.log('Get service api...');
        try {
            //let find the services
            let services = await Service.findAll({
                where: {
                    isActive: true
                },
                order:[['name','ASC']]
            });
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: services,
                error: {},
                message: "Services fetched"
            })
        }
        catch (error) {
            console.log('Internal server error:', error);
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
    deleteService: async(req,res)=>{
        console.log('deleteServices API...');
        try{
            let {id} = req.body;
           const validationErrors = validationResult(req);
            if (!validationErrors.isEmpty()) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    errors: validationErrors.array(),
                    message: 'Validation failed'
                });
            }
            let checkService = await Service.findOne({
                where:{
                    id:id,
                },
                raw:true
            });
            if(!checkService){
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status:ResponseCodes.NOT_FOUND,
                    data:{},
                    error:{message:"Service not found. check id"},
                    message:"Service not found"
                })
            }
            const deleteService = await Service.destroy({
                where:{
                    id:id
                }
            });
            const deletedService = await Service.findOne({
                where:{id:id}
            });
            return res.status(ResponseCodes.SUCCESS).json({
                status:ResponseCodes.SUCCESS,
                data:deleteService,
                error:{},
                message:"Service deleted successfully."
            })

        }
        catch(error){
            console.log('Internal server error:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    }

}