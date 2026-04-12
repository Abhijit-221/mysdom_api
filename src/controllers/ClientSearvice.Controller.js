const { validationResult } = require('express-validator');
const { ResponseCodes } = require('../utils/constant');
const ClientService = require('../models/ClienServiceSchema');
const User = require('../models/UserSchema');
const Client = require('../models/ClientSchema');
const Service = require('../models/ServiceSchema');
const { Op } = require('sequelize');
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
                let getUser = await User.findOne({
                    where:{
                        id: req.user._id,
                        clientId: clientId,
                        isActive: true
                    },
                    raw:true 
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
                where:{
                    clientId: clientId,
                    serviceId: serviceId
                },
                raw:true
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
            const newClientService = {
                clientId,
                serviceId,
                tatDays,
                createdBy: req.user.id
            };
            let createClientService = await ClientService.create(newClientService);
            return res.status(ResponseCodes.CREATED).json({
                status: ResponseCodes.CREATED,
                data: createClientService,
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
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            console.log('page', page, limit);
            let skip = (page - 1) * limit;
            search = search?.trim();
            let query = {};
            if(!['admin','superadmin'].includes(req.user.role)){
                    query.clientId=req.user.id
            }
            if(search){
                query[Op.or] = [
                    { '$client.companyName$': { [Op.like]: `%${search}%` } },
                    { '$service.name$': { [Op.like]: `%${search}%` } }
                ]; 
            }
            let clientServices = await ClientService.findAll({
                where: query,
                include: [
                    {
                        model: Client,
                        as: 'client',
                    },
                    {
                        model: Service,
                        as: 'service',
                    }
                ],
                // raw: true,
                // nest: true
                limit: limit,
                offset: skip,
            });
            let countquery = await ClientService.count({
                where: query,
                include: [
                    {
                        model: Client,
                        as: 'client',
                    },
                    {
                        model: Service,
                        as: 'service',
                    }
                ],
            });
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: {
                    clientServices,
                    count: countquery,
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
               where: {id:id},raw:true
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
            // if (req.user.role === 'user') {
            //     let getUser = await User.findOne({
            //         where:{
            //             id: req.user.id,
            //             clientId: req.body.clientId,
            //             isActive: true
            //         },
            //         raw:true
            //     });
            //     if (!getUser) {
            //         return res.status(ResponseCodes.UNAUTHORIZED).json({
            //             status: ResponseCodes.UNAUTHORIZED,
            //             data: {},
            //             error: 'Unauthorized to assign service to this client',
            //             message: 'Unauthorized to assign service to this client'
            //         });
            //     }
            // }
            if(clientId){
                //let check client exist or not 
                let checkClient = await Client.findOne({
                    where: {
                        id:clientId
                    },
                    raw:true
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
                let checkServices = await Service.findOne({
                    where: {
                        id:serviceId,
                    },
                    raw:true
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
                    where: {
                        clientId: clientId || checkClientSevice.clientId,
                        serviceId: serviceId || checkClientSevice.serviceId,
                    },
                    raw: true
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
                updatedBy:req.user.id,
                ...isActive!=undefined && {isActive}
            } ;
            // if(req.user.role = 'admin' || req.user.role)
            console.log(updatedData);
            await ClientService.update(updatedData, {
                where: {
                    id:id
                }
            });
            let updatedClientService= await ClientService.findOne({
                where: {id:id},
                include: [
                    {
                        model: Client,
                        as: 'client',
                    },
                    {
                        model: Service,
                        as: 'service',
                    }
                ]
            });
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
    },
    /*
    * @route POST /api/v1/mysdom/client/add
    * @desc Get service with client
    * @authentication  true [admin]
    */
   getClientServiceByClient: async(req,res)=>{
        console.log('Get client service with client id api...');
        try{
            let {client_id} = req.params;
            console.log(client_id);
            //let check client exist or not
            let client = await Client.findOne({
                where:{
                    id:client_id,
                    isActive:true,
                },
                raw:true
            });
            if(!client){
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status:ResponseCodes.NOT_FOUND,
                    data:{},
                    error:"Client not found",
                    message:"Client not found"
                })
            }

            let clientService = await ClientService.findAll({
                where:{
                    clientId:client_id,
                    isActive:true,
                },
                include:[
                    {
                        model:Client,
                        as:"client",
                        required:true
                    },
                    {
                        model:Service,
                        as:"service",
                        required:true
                    }
                ],
                order: [[{ model: Service, as: "service" }, "name", "ASC"]],
                
            });
            return res.status(ResponseCodes.SUCCESS).json({
                status:ResponseCodes.SUCCESS,
                data:clientService,
                error:{},
                message:"Client Service fetched"
            })
        }
        catch(error){
            console.error('Error in update Client Service List:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
   },
    /*
    * @route GET /api/v1/mysdom/client/service/delete
    * @desc Get new client
    * @authentication  true [admin]
    */
   deleteClientService: async(req,res)=>{
    try{
        let {clientserv_id} = req.body;
        if(!clientserv_id){
            return res.status(ResponseCodes.BAD_REQUEST).json({
                status:ResponseCodes.BAD_REQUEST,
                data:{},
                error:{message:"clientserv_id required"},
                message:"clientserv_id  required"
            })
        }
        let checkClientService = await ClientService.findOne({
            where:{
                id:clientserv_id
            },
            raw:true
        });
        if(!checkClientService){
            return res.status(ResponseCodes.NOT_FOUND).json({
                status:ResponseCodes.NOT_FOUND,
                data:{},
                error:{message:"Client service not found! check clientserv_id"},
                message:"Client service not found"
            })
        }
        let deleteClienService = await ClientService.destroy({
            where:{
                id:clientserv_id
            }
        });
        let deleteClientService = await ClientService.findOne({
            where:{
                id:clientserv_id,
                deletedAt:{[Op.ne]:null}
            },
            raw:true
        });
        return res.status(ResponseCodes.SUCCESS).json({
            status:ResponseCodes.SUCCESS,
            data:deleteClienService,
            error:{},
            message:'Client deleted successfully'
        })


    }catch(error){
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