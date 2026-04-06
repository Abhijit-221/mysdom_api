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
const { sequelize } = require("../config/db2.config");
const BGVEmployment = require("../models/BGVEmployeementSchema");
const path = require("path");
const { parseFile } = require("../utils/fileParser");
const { v4: uuidv4 } = require('uuid');
const ClientBatchUploadDocs = require("../models/ClientBatchUploadSchema");
const { raw } = require("express");
const BatchUploadService = require("../models/BGVBatchUploadServiceSchema");


// const fs = require('fs/promises');
//delete files if error or any error occur in API//for fields uploaded files
const deleteUploadedFiles = async (files) => {
    if (!files) return;

    for (const field of Object.keys(files)) {
        for (const file of files[field]) {
            try {
                const filePath = path.resolve(file.path);
                await fs.unlinkSync(filePath);
                console.log(`Deleted: ${filePath}`);
            } catch (err) {
                console.error(`Error deleting ${file.path}:`, err.message);
            }
        }
    }
};
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
            let getLastBgvRequest = await BGVRequest.findOne({
                where: {},
                order: [['createdAt', 'desc']],
            });
            if (getLastBgvRequest && getLastBgvRequest.request_id) {
                if (getLastBgvRequest.request_id) {
                    let newDigit = parseInt(getLastBgvRequest.request_id.split('-')[3]) + 1
                    inputData.request_id = `MYS-TRL-BBS-${newDigit}`
                }
            }
            else {
                inputData.request_id = "MYS-TRL-BBS-1"
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
                if (req.files && req.files.length) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    errors: validationErrors.array(),
                    message: 'Validation failed'
                });
            }

            let inputData = {
                id,
                candidate_name,
                candidate_phone,
                candidate_email,
                designation,
                department,
                id_type,
                id_number,
                // id_doc,
                current_address,
                current_landmark,
                current_residency,
                current_duration,
                permanent_address,
                permanent_landmark,
                permanent_residency,
                permanent_duration,
                father_name,
                mother_name,
                gender,
                dob,
                institute_name,
                university,
                education_start,
                education_end,
                roll_number,
                qualification,
                specialization,
                passing_year,
                // edu_doc,
                priority,
                bgvEmployments,
                removeEmployments,
                // assignedTo,
                slaDueDate,
                addservice,
                removeService,
            } = req.body;
            //let check BGV request exist or not
            let bgvRequest = await BGVRequest.findOne({
                where: {
                    id: id
                },
                raw: true
            });
            if (!bgvRequest) {
                if (req.files && req.files.length) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: 'BGV request not found',
                    message: 'BGV request not found'
                });
            }
            if (!['admin', 'superadmin'].includes(req.user.role) && bgvRequest.clientId !== req.user.client) {
                if (req.files && req.files.length) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.UNAUTHORIZED).json({
                    status: ResponseCodes.UNAUTHORIZED,
                    data: {},
                    error: 'Unauthorized to update this BGV request',
                    message: 'Unauthorized to update this BGV request'
                });
            }
            if (req.user.role === 'user' && bgvRequest.submittedBy !== req.user.id) {
                if (req.files && req.files.length) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.UNAUTHORIZED).json({
                    status: ResponseCodes.UNAUTHORIZED,
                    data: {},
                    error: 'Unauthorized to update this BGV request',
                    message: 'Unauthorized to update this BGV request'
                });
            }
            // if (assignedTo) {
            //     if (req.user.role !== 'user') {
            //         return res.status(ResponseCodes.UNAUTHORIZED).json({
            //             status: ResponseCodes.UNAUTHORIZED,
            //             data: {},
            //             error: 'Unauthorized to update assignedTo field',
            //             message: 'Unauthorized to update assignedTo field'
            //         });
            //     }
            //     //let check assigned to user exist or not
            //     // let assignedToUser = await UserSchema.findOne({ _id: assignedTo, role: 'admin', is_deleted: false });
            //     // if (!assignedToUser) {
            //     //     return res.status(ResponseCodes.NOT_FOUND).json({
            //     //         status: ResponseCodes.NOT_FOUND,
            //     //         data: {},
            //     //         error: 'Assigned to user not found',
            //     //         message: 'Assigned to user not found'
            //     //     });
            //     // }

            // }
            if (candidate_email || candidate_phone) {
                //check BGV request exist or not with same candidate email
                let bgvRequestWithSameEmailOrPhone = await BGVRequest.findOne({
                    where: {
                        [Op.or]: [
                            { "candidate_email": candidate_email },
                            { "candidate_phone": candidate_phone }
                        ],
                        clientId: req.user.client,
                        id: { [Op.ne]: id },
                    },
                    raw: true
                });
                if (bgvRequestWithSameEmailOrPhone) {
                    if (req.files && req.files.length) {
                        req.files.forEach(file => {
                            fs.unlink(file.path, () => { });
                        });
                    }
                    return res.status(ResponseCodes.CONFLICT).json({
                        status: ResponseCodes.CONFLICT,
                        data: {},
                        error: 'Another BGV request with same candidate email/phone no already exists',
                        message: 'Another BGV request with same candidate email/phone no already exists'
                    });
                }
            }

            if (req.files && req.files.length) {

                req.files.forEach(file => {

                    const match = file.fieldname.match(/bgvEmployments\[(\d+)\]\[job_doc\]/);
                    console.log("match:", match);
                    if (!match) {
                        if (file.fieldname === 'id_doc') {
                            inputData.id_doc = file.path;
                        }
                        if (file.fieldname === 'edu_doc') {
                            inputData.edu_doc = file.path;
                        }
                        return;
                    }

                    const index = match[1];

                    if (!bgvEmployments) {
                        bgvEmployments = [];
                    }

                    if (!bgvEmployments[index]) {
                        bgvEmployments[index] = {};
                    }

                    bgvEmployments[index].job_doc = file.path;
                });
                console.log("--->", req.files);
                // inputData.id_doc = req.files.id_doc ? req.files.id_doc[0].path : null;
                // inputData.job_doc = req.files.job_doc ? req.files.job_doc[0].path : null;
                // inputData.edu_doc = req.files.edu_doc ? req.files.edu_doc[0].path : null;

            }
            console.log('bgv inputData:', inputData, bgvEmployments);


            const bgvRequestData = Object.fromEntries(
                Object.entries(inputData).filter(([key, value]) => {
                    return (
                        value !== null &&
                        value !== undefined &&
                        value !== '' &&
                        !(Array.isArray(value) && value.length === 0)
                    );
                })
            );
            console.log('bgvRequestData:', bgvRequestData);


            let updateTransaction = await sequelize.transaction(async (t) => {

                if (bgvRequestData.id_doc && (bgvRequest.id_doc && (bgvRequest.id_doc !== null || bgvRequest.id_doc !== ""))) {
                    await fs.unlinkSync(bgvRequest.id_doc);
                }
                if (bgvRequestData.edu_doc && (bgvRequest.edu_doc && (bgvRequest.edu_doc !== null || bgvRequest.edu_doc !== ""))) {
                    await fs.unlinkSync(bgvRequest.edu_doc);
                }
                let updateBGVRequest = await BGVRequest.update(bgvRequestData, {
                    where: {
                        id: inputData.id
                    },
                    transaction: t
                });
                if (bgvEmployments && bgvEmployments.length) {
                    for (let employement of bgvEmployments) {
                        employement.isCurrent = employement.isCurrent === 'true' || employement.isCurrent === true ? true : false;
                        if (employement.id) {
                            let getEmployeement = await BGVEmployment.findOne({
                                where: {
                                    id: employement.id
                                },
                                transaction: t,
                                raw: true
                            });
                            if (employement.job_doc && (getEmployeement && getEmployeement.job_doc)) {
                                await fs.unlinkSync(getEmployeement.job_doc);
                            }
                            //made here if iscurrent then update end date
                            const empData = {
                                company_name: employement.company_name,
                                employee_id: employement.employee_id,
                                employment_start: employement.employment_start,
                                isCurrent: employement.isCurrent,
                                employment_end: employement.isCurrent === 'true' || employement.isCurrent === true ? null : employement.employment_end,
                                job_title: employement.job_title,
                                leaving_reason: employement.leaving_reason,
                                job_doc: employement.job_doc
                            }
                            console.log("empData---->", empData);
                            await BGVEmployment.update(empData, {
                                where: {
                                    id: employement.id
                                }, transaction: t
                            });
                        }
                        else {
                            for (let key in employement) {
                                if (employement[key] === '' || employement[key] === undefined) {
                                    employement[key] = null;
                                }
                            }
                            console.log('employeement :', employement)
                            employement['bgvRequestId'] = id;
                            delete employement.id;
                            const checkExistEmployeement = await BGVEmployment.findOne({
                                where: {
                                    [Op.or]: [
                                        { company_name: employement.company_name },
                                        { employee_id: employement.employee_id }
                                    ]
                                },
                                raw: true
                            });
                            if (!checkExistEmployeement) {
                                await BGVEmployment.create(employement, { transaction: t });
                            }

                        }
                    }
                }
                if (removeEmployments && removeEmployments.length) {
                    for (let emp of removeEmployments) {
                        const getEmployeement = await BGVEmployment.findOne({
                            where: {
                                id: emp
                            },
                            transaction: t,
                            raw: true
                        });

                        if (getEmployeement && getEmployeement.job_doc) {
                            await fs.unlinkSync(getEmployeement.job_doc);
                        }
                        await BGVEmployment.destroy({
                            where: {
                                id: emp
                            }, transaction: t
                        })
                    }
                }
                //Add new services 
                if (addservice && addservice.length) {
                    for (let service_id of addservice) {
                        let checkServiceExist = await BGVRequestService.findOne({
                            where: {
                                requestId: inputData.id,
                                serviceId: service_id
                            },
                            raw: true
                        });
                        if (!checkServiceExist) {
                            await BGVRequestService.create({
                                requestId: inputData.id,
                                serviceId: service_id,
                                createdBy: req.user.id
                            }, { transaction: t })
                        }

                    }
                }
                //Remove services
                if (removeService && removeService.length) {
                    for (let service_id of removeService) {
                        console.log("service_id:", service_id);
                        let checkServiceExist = await BGVRequestService.findOne({
                            where: {
                                requestId: inputData.id,
                                serviceId: service_id
                            },
                            raw: true
                        });
                        if (checkServiceExist) {
                            let deleted = await BGVRequestService.destroy({
                                where: {
                                    requestId: inputData.id,
                                    serviceId: service_id,
                                    // deletedAt: { [Op.in]: ["", null] }
                                }
                            }, { transaction: t });
                            console.log('deleted:', deleted);
                        }
                    }
                }
                return updateBGVRequest

            })
            //update BGV request

            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: updateTransaction,
                error: null,
                message: 'BGV request updated successfully'
            });
        }
        catch (error) {
            console.error('Error in Update BGV Request:', error);
            if (req.files && req.files.length) {
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
            let skip = (page * limit) - limit;
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
                        { req_code: { [Op.like]: `%${search}%` } },
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
                        model: BGVEmployment,
                        as: 'employments'
                    },
                    {
                        model: BGVRequestService,
                        as: 'bgvReqestService',
                        // required: true,
                        include: [{
                            model: Service,
                            as: 'services',
                            // required: true
                        }]
                    }
                ],
                order: [['createdAt', 'desc']],
                limit: limit,
                offset: skip
            });
            let bgvRequestCount = await BGVRequest.count({
                ...whereClause,
                distinct: true,
                col: 'id',
                include: [
                    {
                        model: Client,
                        as: 'client'
                    },
                    {
                        model: BGVEmployment,
                        as: 'employments'
                    },
                    {
                        model: BGVRequestService,
                        as: 'bgvReqestService',
                        // required: true,
                        include: [{
                            model: Service,
                            as: 'services',
                            // required: true
                        }]
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
            const file = req.files;
            console.log('file:', req.files);
            const validationErrors = validationResult(req);
            if (!validationErrors.isEmpty()) {
                if (req.files) {
                    await deleteUploadedFiles(req.files);
                }

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
                if (req.files) {
                    await deleteUploadedFiles(req.files);
                }
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: "BGV request service not found",
                    error: "BGV request service not found"
                })
            }
            const updateData = {
                status: status || bgvRequest.status,
                remark: remark || bgvRequest.remark,
                updatedBy: req.user.id
            };
            if (req.files && Object.keys(req.files).length > 0) {
                Object.keys(req.files).forEach((field) => {
                    const fileArr = req.files[field];

                    if (fileArr && fileArr.length > 0) {
                        // assign first file path
                        updateData[field] = fileArr[0].path.replace(/\\/g, '/');
                    }
                });
            }

            if (updateData.doc_1 && bgvRequest.doc_1 && fsSync.existsSync(bgvRequest.doc_1)) {
                await fs.unlink(bgvRequest.doc_1);
            }
            if (updateData.doc_2 && bgvRequest.doc_2 && fsSync.existsSync(bgvRequest.doc_2)) {
                await fs.unlink(bgvRequest.doc_2);
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
                const allClosed = statuses.every(s => s === "CLOSED");

                if (allRejected) {
                    finalStatus = "REJECTED";
                } else if (allCompleted) {
                    finalStatus = "COMPLETED";
                } else if (allHold) {
                    finalStatus = "ON_HOLD";
                }
                else if (allClosed) {
                    finalStatus = "CLOSED";
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
            if (req.files) {
                await deleteUploadedFiles(req.files);
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
    * @route POST /api/v1/mysdom/BGVRequest/services/create
    * @desc services get BGV request 
    * @authentication  true [admin,user,superadmin]
    */
    bgvReqCreate: async (req, res) => {
        console.log("BGV req create api...");
        try {
            const validationErrors = validationResult(req);
            if (!validationErrors.isEmpty()) {
                if (req.files && req.files.length) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
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
                if (req.files && req.files.length) {
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
                if (req.files && req.files.length) {
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

            console.log(inputData);
            //let get service with ths client exist 
            let serviceError = []
            for (const serviceid of inputData.service) {

                let clientService = await ClientService.findOne({
                    where: {
                        clientId: client.id,
                        serviceId: serviceid
                    },
                });
                if (!clientService) {
                    serviceError.push(serviceid);
                }
            };
            if (serviceError.length) {
                if (req.files && req.files.length) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(ResponseCodes.NOT_FOUND).json({

                    status: ResponseCodes.NOT_FOUND,
                    data: [],
                    error: `Client with these services not found,${serviceError}`,
                    message: `Client with these services not found`,

                })
            }
            inputData.submittedBy = req.user.id;
            if (req.files && req.files.length) {

                req.files.forEach(file => {

                    const match = file.fieldname.match(/bgvEmployments\[(\d+)\]\[job_doc\]/);

                    if (!match) {
                        if (file.fieldname === 'id_doc') {
                            inputData.id_doc = file.path;
                        }
                        if (file.fieldname === 'edu_doc') {
                            inputData.edu_doc = file.path;
                        }
                        return;
                    }

                    const index = match[1];

                    if (!req.body.bgvEmployments) {
                        req.body.bgvEmployments = [];
                    }

                    if (!req.body.bgvEmployments[index]) {
                        req.body.bgvEmployments[index] = {};
                    }

                    req.body.bgvEmployments[index].job_doc = file.path;

                });
                console.log("--->", req.files);
                // inputData.id_doc = req.files.id_doc ? req.files.id_doc[0].path : null;
                // inputData.job_doc = req.files.job_doc ? req.files.job_doc[0].path : null;
                // inputData.edu_doc = req.files.edu_doc ? req.files.edu_doc[0].path : null;

            }

            // let getLastBgvRequest = await BGVRequest.findOne({
            //     where: {},
            //     order: [['createdAt', 'desc']],
            // });

            // let newDigit = 1;

            // if (getLastBgvRequest?.req_code) {
            //     const parts = getLastBgvRequest.req_code.split('-');
            //     const lastNumber = parseInt(parts[3], 10);

            //     if (!isNaN(lastNumber)) {
            //         newDigit = lastNumber + 1;
            //     }
            // }
            // // pad with leading zeros (4 digits)
            // const paddedNumber = String(newDigit).padStart(4, '0');

            // inputData.req_code = `MYS-TRL-BBS-${paddedNumber}`;
            console.log("inputData:", inputData);
            let createTransaction = await sequelize.transaction(async (t) => {

                let createBgvRequest = await BGVRequest.create(inputData, { transaction: t });
                if (inputData.bgvEmployments && inputData.bgvEmployments.length) {
                    let employeeDetailsData = inputData.bgvEmployments.map((employeeDetail) => {
                        const cleanedData = Object.fromEntries(
                            Object.entries(employeeDetail).map(([key, value]) => [
                                key,
                                value === "" ? null : value
                            ])
                        );
                        return {
                            ...cleanedData,
                            bgvRequestId: createBgvRequest.id
                        }
                    });
                    let createEmployeeDetails = await BGVEmployment.bulkCreate(employeeDetailsData, { transaction: t });
                }
                let reqService = inputData.service.map((serviceid) => {
                    return {
                        requestId: createBgvRequest.id,
                        serviceId: serviceid,
                        createdBy: req.user.id,
                        updatedBy: req.user.id
                    }
                });

                let createServices = await BGVRequestService.bulkCreate(reqService, { transaction: t });
                return createBgvRequest;
            })

            return res.status(ResponseCodes.CREATED).json({
                status: ResponseCodes.CREATED,
                data: createTransaction,
                error: {},
                message: "Request created successfully."
            })

        }
        catch (error) {
            console.log('Error in Get Services of BGV Request:', error);
            if (req.files && req.files.length) {
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
    * @route GET /api/v1/mysdom/BGVRequest/services/get
    * @desc services get BGV request 
    * @authentication  true [admin,user,superadmin]
    */
    getBGVRequestById: async (req, res) => {
        console.log('BGV request services get API...');
        try {
            let { request_id } = req.params;

            let whereClause = {
                id: request_id
            };
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


            let bgvRequests = await BGVRequest.findOne({
                ...whereClause,
                include: [
                    {
                        model: Client,
                        as: 'client'
                    },
                    {
                        model: BGVEmployment,
                        as: 'employments'
                    },
                    {
                        model: BGVRequestService,
                        as: 'bgvReqestService',
                        required: true,
                        include: [{
                            model: Service,
                            as: 'services',
                            // required: true
                        }]
                    }
                ],
            });
            if (!bgvRequests) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: "Applicant Request form not found",
                    message: "Applicant Request form not found"
                })
            }
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: bgvRequests,
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
    * @route POST /api/v1/mysdom/BGVRequest/bach-upload
    * @desc services get BGV request 
    * @authentication  true [user]
    */


    uploadCandidates: async (req, res) => {
        try {
            // console.log(req.user);
            if (!req.file) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: "File required.",
                    message: "File is required"
                });
            }
            let { service_id } = req.body;
            if (!service_id) {
                if (req.file) {
                    fs.unlinkSync(filePath);
                }
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: "Service id required",
                    message: "Service id required"
                })
            }
            let getService = await Service.findOne({
                where: {
                    id: service_id,
                },
                raw: true,
            });
            if (!getService) {
                if (req.file) {
                    fs.unlinkSync(filePath);
                }
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: "Service not found, check service_id",
                    message: 'Service not found'
                })
            }
            const MAX_RECORDS = 500;
            // ✅ Expected columns from template
            const REQUIRED_COLUMNS = ["f_name", "candidate_email", "candidate_phone"];


            const filePath = req.file.path;
            const ext = path.extname(req.file.originalname).slice(1);

            // ✅ Parse file
            const records = await parseFile(filePath, ext);
            console.log("records:", records);
            if (!records.length) {
                if (req.file) {
                    fs.unlinkSync(filePath);
                }
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: "File is empty",
                    message: "File is empty"
                });
            }

            // ✅ Limit check
            if (records.length > MAX_RECORDS) {
                if (req.file) {
                    fs.unlinkSync(filePath);
                }
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: `Max ${MAX_RECORDS} records allowed`,
                    message: `Max ${MAX_RECORDS} records allowed`,
                });
            }

            // ✅ Column validation
            const fileColumns = Object.keys(records[0]).map((c) =>
                c.toLowerCase().trim()
            );

            const missingColumns = REQUIRED_COLUMNS.filter(
                (col) => !fileColumns.includes(col)
            );

            if (missingColumns.length > 0) {
                if (req.file) {
                    fs.unlinkSync(filePath);
                }
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: `Missing columns: ${missingColumns.join(", ")}`,
                    message: `Missing columns: ${missingColumns.join(", ")}`,
                });
            }

            // ✅ Row validation
            let validData = [];
            let errors = [];
            let duplicateEmail = [];
            let duplicatePhone = [];

            const seenEmails = new Map();  // email → first seen row index
            const seenPhones = new Map();  // phone → first seen row index

            records.forEach((row, index) => {
                const rowNum = index + 1;
                let rowErrors = [];

                // ─── Field Validation ───────────────────────────────────────────────────────
                if (!row.f_name) rowErrors.push("First Name required");

                if (row.candidate_email && !/\S+@\S+\.\S+/.test(row.candidate_email))
                    rowErrors.push("Invalid email");
                console.log('phone:', row.candidate_phone);
                if (row.candidate_phone && row.candidate_phone.toString().length < 10)
                    rowErrors.push("Invalid phone");

                if (rowErrors.length > 0) {
                    errors.push({ row: rowNum, errors: rowErrors });
                    return; // skip duplicate check for invalid rows
                }

                // ─── Duplicate Detection ────────────────────────────────────────────────────
                const email = row.candidate_email?.toString().toLowerCase().trim() || null;
                const phone = row.candidate_phone?.toString().trim() || null;

                let isDuplicate = false;

                if (email && seenEmails.has(email)) {
                    isDuplicate = true;
                    const originalRowNum = seenEmails.get(email);

                    duplicateEmail.push({
                        duplicate: { row: rowNum, data: buildRecord(row) },
                        original: { row: originalRowNum, data: buildRecord(validData.find((_, i) => i === originalRowNum - 1)) },
                    });
                } else if (email) {
                    seenEmails.set(email, rowNum);
                }

                if (phone && seenPhones.has(phone)) {
                    isDuplicate = true;
                    const originalRowNum = seenPhones.get(phone);

                    duplicatePhone.push({
                        duplicate: { row: rowNum, data: buildRecord(row) },
                        original: { row: originalRowNum, data: buildRecord(validData.find((_, i) => i === originalRowNum - 1)) },
                    });
                } else if (phone) {
                    seenPhones.set(phone, rowNum);
                }

                // ─── Push to validData only if not a duplicate ──────────────────────────────
                if (!isDuplicate) {
                    validData.push(buildRecord(row));
                }
            });

            // ─── Helper ──────────────────────────────────────────────────────────────────
            function buildRecord(row) {
                const f_name = row.f_name?.trim() || null;
                const m_name = row.m_name?.trim() || null;
                const l_name = row.l_name?.trim() || null;
                const full_address = row.full_address?.trim() || null;
                const state = row.state?.trim() || null;
                // const id = uuidv4();
                return {
                    // f_name,
                    // m_name,
                    // l_name,
                    id: uuidv4(),
                    clientId: req.user.client,
                    candidate_name: [f_name, m_name, l_name].filter(Boolean).join(" ") || null,
                    permanent_address: `${row.full_address?.trim()}${state ? state : ""}`,
                    permanent_landmark: row.Loction?.trim() || null,
                    candidate_email: row.candidate_email?.trim() || null,
                    candidate_phone: row.candidate_phone?.trim() || null,
                    permanent_address: [full_address, state].filter(Boolean).join(", ") || null,
                    submittedBy: req.user.id
                };
            }

            if (errors.length > 0) {
                if (req.file) {
                    fs.unlinkSync(filePath);
                }
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    errors,
                    message: "Validation failed",
                });
            }
            // console.log(req.user);
            console.log('valid data:', validData);
            // ─── Extract emails and phones from validData ─────────────────────────────────
            const emails = validData.map((r) => r.candidate_email).filter(Boolean);
            const phones = validData.map((r) => r.candidate_phone).filter(Boolean);

            const existingCandidates = await BGVRequest.findAll({
                where: {
                    [Op.or]: [
                        ...(emails.length ? [{ candidate_email: { [Op.in]: emails } }] : []),
                        ...(phones.length ? [{ candidate_phone: { [Op.in]: phones } }] : []),
                    ],
                    status: { [Op.notIn]: ['COMPLETED', 'REJECTED'] },
                    clientId: req.user.client,
                },
                attributes: ["candidate_email", "candidate_phone"], // fetch only what's needed
                raw: true,
            });
            // ─── Build lookup Sets from DB result ────────────────────────────────────────
            const existingEmails = new Set(
                existingCandidates.map((c) => c.candidate_email?.toLowerCase().trim()).filter(Boolean)
            );
            const existingPhones = new Set(
                existingCandidates.map((c) => c.candidate_phone?.trim()).filter(Boolean)
            );

            // ─── Split validData into new vs skipped ──────────────────────────────────────
            let newCandidates = [];
            let skippedCandidates = [];
            let reqestWithService = [];
            validData.forEach((record) => {
                const emailExists = record.candidate_email && existingEmails.has(record.candidate_email.toLowerCase().trim());
                const phoneExists = record.candidate_phone && existingPhones.has(record.candidate_phone.trim());

                if (emailExists || phoneExists) {
                    skippedCandidates.push({
                        ...record,
                        skip_reason: [
                            emailExists && "Email already exists",
                            phoneExists && "Phone already exists",
                        ].filter(Boolean).join(", "),
                    });
                } else {
                    newCandidates.push(record);
                    reqestWithService.push({
                        requestId: record.id,
                        serviceId: service_id,
                        createdBy: req.user.id,
                        updatedBy: req.user.id,
                    })
                }
            });
            console.log('new data:', reqestWithService);
            console.log('file:', req.file);
            // ─── Bulk insert new candidates ───────────────────────────────────────────────
            let createBgv = [];
            if (newCandidates.length > 0) {
                //put transaction with create
                let transactionData = await sequelize.transaction(async (t) => {

                    // ✅ DB Insert (Bulk)
                    createBgv = await BGVRequest.bulkCreate(newCandidates, { transaction: t });
                    await BGVRequestService.bulkCreate(reqestWithService, { transaction: t });
                    await ClientBatchUploadDocs.create({
                        client_id: req.user.client,
                        file_path: req.file.path,
                        file_size: req.file.size
                    }, { transaction: t })
                    return createBgv;
                });
                return res.status(ResponseCodes.CREATED).json({
                    status: ResponseCodes.CREATED,
                    data: {
                        transactionData,
                        skippedCandidates
                    },
                    error: {},
                    message: `${newCandidates.length} records uploaded successfully`
                })

            } else {
                if (req.file) {
                    fs.unlinkSync(filePath);
                }
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: { newCandidates, skippedCandidates },
                    error: "",
                    message: "valid data not found"
                })
            }


        } catch (err) {
            console.log(err);
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            if (err.code === "INVALID_HEADERS") {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    message: err.message,
                    missingColumns: err.missingColumns, // ["Email"] etc.
                });
            }
            console.error(err);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: err,
                message: "Server error",
            });
        }
    },


    /**
     * 
     */
    createBatchUploadService: async (req, res) => {
        try {
            let inputData = req.body;
            if (!inputData.service_id) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: { message: "Invalid input, service_id required" },
                    message: "Invalid input, service_id required"
                })
            }
            let getService = await Service.findOne({
                where: {
                    id: inputData.service_id,
                },
                raw: true
            });
            if (!getService) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: { message: "Service not found, check service_id" },
                    message: "Service not found"
                });
            }
            //let create or update 
            let getBachUploadService = await BatchUploadService.findOne({
                where: {},
                limit: 1,
                raw: true,
            });
            if (getBachUploadService) {
                await BatchUploadService.update({ service_id: inputData.service_id }, {
                    where: {
                        id: getBachUploadService.id
                    }
                })
            }
            else {
                await BatchUploadService.create({ service_id: inputData.service_id });
            }
            let bachUploadService = await BatchUploadService.findOne({
                where: {},
                raw: true,
            });
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: bachUploadService,
                error: {},
                message: "Bath upload saved successfully"
            })

        }
        catch (error) {
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error,
                message: "Server error",
            });
        }

    },


    /**
     * 
     */
    getBathUploadService: async (req, res) => {
        try {
            let getBatchUploadService = await BatchUploadService.findOne({
                where: {},
                raw: true,
            });
            if (!getBatchUploadService) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: { message: "Service not found" },
                    message: "Service not found"
                })
            }
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: getBatchUploadService,
                error: {},
                message: "Batch upload service fetched successfully"
            })

        }
        catch (error) {
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error,
                message: "Server error",
            });
        }
    }

}