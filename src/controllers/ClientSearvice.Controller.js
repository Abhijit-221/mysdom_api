const { validationResult } = require('express-validator');
const { ResponseCodes } = require('../utils/constant');
const ClientService = require('../models/ClienServiceSchema');
const UserSchema = require('../models/UserSchema');
const ClientSchema = require('../models/ClientSchema');
const ServiceSchema = require('../models/ServiceSchema');
module.exports = {
    /*
   * @route PIST /api/v1/mysdom/client-service/add
   * @desc Add a service within client
   * @authentication  true [admin]
   */
    addClientService: async (req, res) => {
        console.log('Add Client Service API.....');
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

            const { clientId, serviceId, tatDays } = req.body;

            //let check if role user with same clientId then it should allow
            if (req.user.role === 'user') {
                let getUser = await UserSchema.findOne({
                    _id: req.user._id,
                    clientId: req.body.clientId,
                    is_deleted: false,
                    isActive: true
                });
                if (!getUser) {
                    return res.status(ResponseCodes.UNAUTHORIZED).json({
                        status: ResponseCodes.UNAUTHORIZED,
                        data: {},
                        error: 'Unauthorized to assign service to this client',
                        message: 'Unauthorized to assign service to this client'
                    });
                }
            }
            //let check if client with same service already exists
            const existingClientService = await ClientService.findOne({
                clientId: clientId,
                serviceId: serviceId
            });
            if (existingClientService) {
                return res.status(ResponseCodes.CONFLICT).json({
                    status: ResponseCodes.CONFLICT,
                    data: {},
                    error: 'Service already assigned to the client',
                    message: 'Service already assigned to the client'
                });
            }
            //let create new client service
            const newClientService = new ClientService({
                clientId,
                serviceId,
                tatDays,
                createdBy: req.user._id
            });
            await newClientService.save();
            return res.status(ResponseCodes.CREATED).json({
                status: ResponseCodes.CREATED,
                data: newClientService,
                message: 'Service assigned to client successfully'
            });
        }
        catch (error) {
            console.error('Error in Add Client Service:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },
    /*
   * @route GET /api/v1/mysdom/client-service/list
   * @desc Get list of all client services
   * @authentication  true [admin, user]
   */
    getClientServiceList: async (req, res) => {
        console.log('Get Client Service List API.....');
        try {
            let { page, limit, search } = req.query;
            page = page || 1;
            limit = limit || 10;
            console.log('page', page, limit);
            let skip = (page - 1) * limit;
            search = search?.trim();
            let query = { is_deleted: false };
            if(!['admin','superadmin'].includes(req.user.role)){
                    query.clientId=req.user._id
            }
            const pipeline = [
                { $match: query },

                {
                    $lookup: {
                        from: 'clients',
                        localField: 'clientId',
                        foreignField: '_id',
                        as: 'clientDetails',
                    }
                },
                { $unwind: '$clientDetails' },

                {
                    $lookup: {
                        from: 'services',
                        localField: 'serviceId',
                        foreignField: '_id',
                        as: 'serviceDetails'
                    }
                },
                { $unwind: '$serviceDetails' },
            ];

            // 🔍 Add search condition dynamically
            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { 'clientDetails.companyName': { $regex: search, $options: 'i' } },
                            { 'serviceDetails.name': { $regex: search, $options: 'i' } }
                        ]
                    }
                });
            }
            let countQiery = [...pipeline];
            countQiery.push({
                $group: {
                    _id: null,
                    count: { $sum: 1 }
                },
            });

            // pagination MUST come after search
            pipeline.push(
                { $skip: parseInt(skip) },
                { $limit: parseInt(limit) }
            );

            const clientServices = await ClientService.aggregate(pipeline);
            // console.log('queryCOunt:', countQiery);
            const clentServiceCount = await ClientService.aggregate(countQiery);
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: {
                    clientServices,
                    count: clentServiceCount[0]?.count,
                },
                message: 'Client Service list fetched successfully'
            });
        }
        catch (error) {
            console.error('Error in Get Client Service List:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },
    /*
    * @route PIST /api/v1/mysdom/client-service/update
    * @desc update a service within client
    * @authentication  true [admin,user(which have specific client id) ]
    */
    updateClientService: async (req, res) => {
        console.log('update Client Service API.....');
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
            const {id, clientId, serviceId, tatDays,isActive } = req.body;

            //let check the clienservice exist or not 
            let checkClientSevice = await ClientService.findOne({
                _id:id,
                is_deleted:false
            });
            if(!checkClientSevice){
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status:ResponseCodes.NOT_FOUND,
                    data:{},
                    error:"Invalid id",
                    message:"Invalid id, client service not found",
                })
            }
            //let check if role user with same clientId then it should allow
            if (req.user.role === 'user') {
                let getUser = await UserSchema.findOne({
                    _id: req.user._id,
                    clientId: req.body.clientId,
                    is_deleted: false,
                    isActive: true
                });
                if (!getUser) {
                    return res.status(ResponseCodes.UNAUTHORIZED).json({
                        status: ResponseCodes.UNAUTHORIZED,
                        data: {},
                        error: 'Unauthorized to assign service to this client',
                        message: 'Unauthorized to assign service to this client'
                    });
                }
            }
            if(clientId){
                //let check client exist or not 
                let checkClient = await ClientSchema.findOne({
                    _id:clientId,
                    is_deleted:false
                });
                if(!checkClient){
                    return res.status(ResponseCodes.NOT_FOUND).json({
                        status:ResponseCodes.NOT_FOUND,
                        data:{},
                        error:"Invalid clientId",
                        message:"Invalid clientId"
                    })
                }
            }
            if(serviceId){
                let checkServices = await ServiceSchema.findOne({
                    _id:serviceId,
                    is_deleted:false
                });
                if(!checkServices){
                    return res.status(ResponseCodes.NOT_FOUND).json({
                        status:ResponseCodes.NOT_FOUND,
                        data:{},
                        error:"Invalid servaiceId",
                        message:"Invalid serviceId, Service not found"
                    })
                }
            }
            //let check if client with same service already exists
            if(clientId||serviceId){
                const existingClientService = await ClientService.findOne({
                    clientId: clientId || checkClientSevice.clientId,
                    serviceId: serviceId || checkClientSevice.serviceId,
                    is_deleted:false
                });
                if (existingClientService) {
                    return res.status(ResponseCodes.CONFLICT).json({
                        status: ResponseCodes.CONFLICT,
                        data: {},
                        error: 'Service already assigned with the client',
                        message: 'Service already assigned with the client'
                    });
                }
            }
            let updatedData ={
                ...clientId && {clientId},
                ...serviceId && {serviceId},
                ...tatDays && {tatDays},
                updatedBy:req.user._id,
                ...isActive!=undefined && {isActive}
            } ;
            // if(req.user.role = 'admin' || req.user.role)
            console.log(updatedData);
            let updatedClientService=await ClientService.findByIdAndUpdate({
                is_deletd:false,
                _id:id
            },updatedData);
            return res.status(ResponseCodes.SUCCESS).json({
                status:ResponseCodes.SUCCESS,
                data:updatedClientService,
                message:"Client Service updated successfully."
            })
            
        }
        catch (error) {
            console.error('Error in update Client Service List:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    }

}