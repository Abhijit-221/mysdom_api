const { validationResult } = require("express-validator");
const { ResponseCodes } = require("../utils/constant");
const Client = require("../models/ClientSchema");
const BGVRequest = require("../models/BGVRequestSchema");
const User = require("../models/UserSchema");
const Service = require("../models/ServiceSchema");
const BGVRequestService = require("../models/BGVRequestServiceSchema");
const BGVRequestForm = require("../models/BGVRequestFormSchema");
const fs = require('fs');
const { Op, where } = require("sequelize");
const ClientService = require("../models/ClienServiceSchema");
module.exports = {
    /*
    * @route POST /api/v1/mysdom/BGVRequest/create
    * @desc BGV request create by user which is on user can create BGV request for his client
    * @authentication  true [user]
    */
    create: async (req, res) => {
        console.log('BGV request create API...');
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
            req.files.forEach(file => {

                const match = file.fieldname.match(
                    /services\[(\d+)\]\[form_data\]\[(.+)\]/
                );

                if (!match) return;

                const serviceIndex = match[1];
                const fieldKey = match[2];

                req.body.services[serviceIndex]
                    .form_data[fieldKey] = file.path;

            });
            let { candidate,
                client_id,
                services,
                priority,
                assignedTo,
                slaDueDate } = req.body;
            //let check client exist or not
            // console.log('req.body:-->',req.body);
            // console.log(req.body.services[0].form_data);
            let client = await Client.findOne({
                where: { id: client_id, isActive: true }, raw: true
            });
            if (!client) {
                if (req.files) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: 'Client not found',
                    message: 'Client not found'
                });
            }
            //let check assigned to user exist or not
            let assignedToUser = await User.findOne({ where: { id: assignedTo, role: 'admin' }, raw: true });
            if (!assignedToUser) {
                if (req.files) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: 'Assigned to user not found',
                    message: 'Assigned to user not found'
                });
            }
            //check BGV request exist or not
            let checkBGVRequest = await BGVRequest.findOne({
                where: {
                    [Op.or]: [
                        { candidate_email: candidate.email },
                        { candidate_phone: candidate.phone }
                    ],
                    status: { [Op.notIn]: ['REJECTED', 'COMPLETED'] },
                    clientId: client_id,
                },
                raw: true
            });
            if (checkBGVRequest) {
                if (req.files) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.CONFLICT).json({
                    status: ResponseCodes.CONFLICT,
                    data: {},
                    error: 'BGV request already exist with same candidate email or phone',
                    message: 'BGV request already exist with same candidate email or phone'
                });
            }
            //let check services exist or not
            let notFoundServices = [];
            for (let service of services) {
                let serviceExist = await Service.findOne({ where: { id: service.serviceId, isActive: true }, raw: true });
                if (!serviceExist) {
                    notFoundServices.push(service.serviceId);
                }
            }
            if (notFoundServices.length > 0) {
                if (req.files) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: `Services not found with ids: ${notFoundServices.join(', ')}`,
                    message: `Services not found with ids: ${notFoundServices.join(', ')}`
                });
            }
            //let create BGV request
            let newBGVRequest = await BGVRequest.create({
                clientId: client_id,
                candidate_name: candidate.name,
                candidate_email: candidate.email,
                candidate_phone: candidate.phone,
                ...priority && { priority },
                assignedTo,
                ...slaDueDate && { slaDueDate },
                submittedBy: req.user.id
            });

            //let add services to BGV request
            for (let service of services) {
                let requestService = await BGVRequestService.create({
                    requestId: newBGVRequest.id,
                    serviceId: service.serviceId,
                    createdBy: req.user.id,
                    updatedBy: req.user.id
                });
                let insertFormDatas = [];
                for (let form in service.form_data) {
                    insertFormDatas.push({
                        req_service_id: requestService.id,
                        field_name: form,
                        field_value: service.form_data[form]
                    })
                }
                console.log("insertFormDatas:", insertFormDatas);
                let createRequestForm = await BGVRequestForm.bulkCreate(insertFormDatas);

            }
            //create BGV request

            return res.status(ResponseCodes.CREATED).json({
                status: ResponseCodes.CREATED,
                data: newBGVRequest,
                error: null,
                message: 'BGV request created successfully'
            });

        }
        catch (error) {
            console.error('Error in Add Client:', error);
            if (req.files) {
                req.files.forEach(file => {
                    fs.unlink(file.path, () => { });
                });
            }
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },
    /*
    * @route POST /api/v1/mysdom/BGVRequest/update
    * @desc BGV request update by user
    * @authentication  true [user]
    */
    updateBGVRequest: async (req, res) => {
        console.log('BGV request update API...');
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

            let { id,
                candidate,
                status,
                priority,
                assignedTo,
                slaDueDate } = req.body;
            //let check BGV request exist or not
            let bgvRequest = await BGVRequestSchema.findOne({
                _id: id,
                is_deleted: false,
            });
            if (!bgvRequest) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: 'BGV request not found',
                    message: 'BGV request not found'
                });
            }
            if (req.user.role !== 'admin' && bgvRequest.clientId.toString() !== req.user.client.toString()) {
                return res.status(ResponseCodes.UNAUTHORIZED).json({
                    status: ResponseCodes.UNAUTHORIZED,
                    data: {},
                    error: 'Unauthorized to update this BGV request',
                    message: 'Unauthorized to update this BGV request'
                });
            }
            if (req.user.role === 'user' && bgvRequest.submittedBy.toString() !== req.user._id.toString()) {
                return res.status(ResponseCodes.UNAUTHORIZED).json({
                    status: ResponseCodes.UNAUTHORIZED,
                    data: {},
                    error: 'Unauthorized to update this BGV request',
                    message: 'Unauthorized to update this BGV request'
                });
            }
            if (assignedTo) {
                if (req.user.role !== 'user') {
                    return res.status(ResponseCodes.UNAUTHORIZED).json({
                        status: ResponseCodes.UNAUTHORIZED,
                        data: {},
                        error: 'Unauthorized to update assignedTo field',
                        message: 'Unauthorized to update assignedTo field'
                    });
                }
                //let check assigned to user exist or not
                let assignedToUser = await UserSchema.findOne({ _id: assignedTo, role: 'admin', is_deleted: false });
                if (!assignedToUser) {
                    return res.status(ResponseCodes.NOT_FOUND).json({
                        status: ResponseCodes.NOT_FOUND,
                        data: {},
                        error: 'Assigned to user not found',
                        message: 'Assigned to user not found'
                    });
                }

            }
            if (candidate && candidate.email) {
                //check BGV request exist or not with same candidate email
                let bgvRequestWithSameEmail = await BGVRequestSchema.findOne({
                    $or: [
                        { "candidate.email": candidate.email },
                        { "candidate.phone": candidate.phone }
                    ],
                    _id: { $ne: id },
                    clientId: req.user.client,
                    is_deleted: false
                });
                if (bgvRequestWithSameEmail) {
                    return res.status(ResponseCodes.CONFLICT).json({
                        status: ResponseCodes.CONFLICT,
                        data: {},
                        error: 'Another BGV request with same candidate email already exists',
                        message: 'Another BGV request with same candidate email already exists'
                    });
                }
            }

            //update BGV request
            let updatedBGVRequest = await BGVRequestSchema.findByIdAndUpdate(id, {
                ...candidate && { candidate },
                ...status && { status },
                ...priority && { priority },
                ...assignedTo && { assignedTo },
                ...slaDueDate && { slaDueDate }
            }, { new: true });
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: updatedBGVRequest,
                error: null,
                message: 'BGV request updated successfully'
            });
        }
        catch (error) {
            console.error('Error in Update BGV Request:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },

    /*
    * @route GET /api/v1/mysdom/BGVRequest/services/get
    * @desc services get BGV request 
    * @authentication  true [admin,user,superadmin]
    */
    getBGVRequest: async (req, res) => {
        console.log('BGV request services get API...');
        try {
            let { page, limit, search, status } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            let skip = (page - 1) * limit;
            console.log(limit, skip)

            let whereClause = {};
            if (req.user.role === 'user') {
                let user = await User.findOne({
                    where: {
                        id: req.user.id
                    }
                });
                whereClause.where = {
                    clientId: user.client
                }
            }
            if (search) {
                whereClause.where = {
                    ...whereClause.where,
                    [Op.or]: [
                        { candidate_name: { [Op.like]: `%${search}%` } },
                        { candidate_email: { [Op.like]: `%${search}%` } },
                        { candidate_phone: { [Op.like]: `%${search}%` } },
                    ]

                }
            }
            let statusCondition = {};
            if (status) {
                statusCondition = {
                    where: {
                        status: status
                    }
                }
            }
            let bgvRequests = await BGVRequest.findAll({
                ...whereClause,
                include: [
                    {
                        model: Client,
                        as: 'client'
                    },
                    {
                        model: BGVRequestService,
                        as: 'bgvReqestService',
                        ...statusCondition,
                        required: true,
                        // include: [{
                        //     model: BGVRequestForm,
                        //     as: 'bgvRequestForm',
                        //     required: true
                        // }]
                    }
                ],
                order: [['createdAt', 'desc']],
                limit: limit,
                offset: skip
            });
            let bgvRequestCount = await BGVRequest.count({
                ...whereClause,
                include: [
                    {
                        model: Client,
                        as: 'client'
                    },
                    {
                        model: BGVRequestService,
                        as: 'bgvReqestService',
                        ...statusCondition,
                        required: true,
                        // include:[{
                        //     model:BGVRequestForm,
                        //     as:'bgvRequestForm',
                        //     required:true
                        // }]
                    }
                ],
                order: [['createdAt', 'desc']],
            });
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: { bgvRequests, count: bgvRequestCount },
                error: {},
                message: 'BGV request services fetched successfully'
            });
        }
        catch (error) {
            console.error('Error in Get Services of BGV Request:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },

    /*
    * @route POST /api/v1/mysdom/BGVRequest/services/get
    * @desc services get BGV request 
    * @authentication  true [admin,user,superadmin]
    */
    updateRequestStatus: async (req, res) => {
        console.log('update bgv request status api...');
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
            let { request_id, service_id, remark, status } = req.body;
            //let check request
            let bgvRequest = await BGVRequestService.findOne({
                where: {
                    requestId: request_id,
                    serviceId: service_id
                },
                raw: true
            });
            if (!bgvRequest) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: "BGV request service not found",
                    error: "BGV request service not found"
                })
            }
            const updateData = {
                status: status,
                updatedBy: req.user.id
            };

            if (remark) {
                updateData.remark = remark;
            }
            let updateBGV = await BGVRequestService.update(updateData, {
                where: {
                    requestId: request_id,
                    serviceId: service_id
                }
            });
            let getReqServices = await BGVRequestService.findAll({
                where: {
                    requestId: request_id
                },
                raw: true
            });
            let finalStatus = "IN_PROGRESS";

            if (getReqServices.length > 0) {
                const statuses = getReqServices.map(s => s.status);

                const allRejected = statuses.every(s => s === "REJECTED");
                const allCompleted = statuses.every(s => s === "COMPLETED");
                const allHold = statuses.every(s => s === "ON_HOLD");

                if (allRejected) {
                    finalStatus = "REJECTED";
                } else if (allCompleted) {
                    finalStatus = "COMPLETED";
                } else if (allHold) {
                    finalStatus = "ON_HOLD";
                }
            }
            await BGVRequest.update(
                { status: finalStatus },
                {
                    where: { id: request_id }
                }
            );
            let getUpdatedBgv = await BGVRequestService.findOne({
                where: {
                    requestId: request_id,
                    serviceId: service_id
                },
                raw: true
            });
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: getUpdatedBgv,
                error: {},
                message: 'BGV reauest updated succesfully'
            });
        }
        catch (error) {
            console.log('Error in Get Services of BGV Request:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },


    /*
    * @route POST /api/v1/mysdom/BGVRequest/services/create
    * @desc services get BGV request 
    * @authentication  true [admin,user,superadmin]
    */
    bgvReqCreate: async (req, res) => {
        console.log("BGV req create api...");
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
            let inputData = req.body;
            let user = req.user.client;
            console.log('user:', user);
            let client = await Client.findOne({
                where: { id: inputData.clientId, isActive: true }, raw: true
            });
            if (!client) {
                if (req.files) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: 'Client not found',
                    message: 'Client not found'
                });
            }
            let checkBGVRequest = await BGVRequest.findOne({
                where: {
                    [Op.or]: [
                        { candidate_email: inputData.candidate_email },
                        { candidate_phone: inputData.candidate_phone }
                    ],
                    status: { [Op.notIn]: ['REJECTED', 'COMPLETED'] },
                    clientId: client.id,
                },
                raw: true
            });
            if (checkBGVRequest) {
                if (req.files) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.CONFLICT).json({
                    status: ResponseCodes.CONFLICT,
                    data: {},
                    error: 'BGV request already exist with same candidate email or phone',
                    message: 'BGV request already exist with same candidate email or phone'
                });
            }

            console.log(inputData.service[0]);
            //let get service with ths client exist 
            let serviceError=[]
            for (const serviceid of inputData.service){

                let clientService = await ClientService.findOne({
                    where:{
                        clientId:client.id,
                        serviceId:serviceid
                    },
                });
                if(!clientService){
                    serviceError.push(serviceid);
                }
            };
            if(serviceError.length){
                if (req.files) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.NOT_FOUND).json({
                    
                    status:ResponseCodes.NOT_FOUND,
                    data:[],
                    error:`Client with these services not found,${serviceError}`,
                    message:`Client with these services not found`,

                })
            }
            inputData.submittedBy=req.user.id;
            if(req.files){
                console.log(req.files);
                inputData.id_doc=req.files.id_doc?req.files.id_doc[0].path:null;
                inputData.job_doc = req.files.job_doc?req.files.job_doc[0].path:null;
                inputData.edu_doc = req.files.edu_doc?req.files.edu_doc[0].path:null;

            }
            console.log(inputData);
            let createBgvRequest = await BGVRequest.create(inputData);
            let reqService = inputData.service.map((serviceid)=>{
                return {
                    requestId:createBgvRequest.id,
                    serviceId:serviceid,
                    createdBy:req.user.id,
                    updatedBy:req.user.id
                }
            })
            let createServices  = await BGVRequestService.bulkCreate(reqService);

            return res.status(ResponseCodes.CREATED).json({
                status:ResponseCodes.CREATED,
                data:createBgvRequest,
                error:{},
                message:"Request created successfully."
            })

        }
        catch (error) {
            console.log('Error in Get Services of BGV Request:', error);
             if (req.files) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    }

}