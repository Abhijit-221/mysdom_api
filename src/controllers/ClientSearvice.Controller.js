const { validationResult } = require('express-validator');
const { ResponseCodes } = require('../utils/constant');
const ClientService = require('../models/ClienServiceSchema');
const UserSchema = require('../models/UserSchema');

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
            let skip = (page - 1) * limit;
            search = search?.trim();

            const pipeline = [
                { $match: query },

                {
                    $lookup: {
                        from: 'clients',
                        localField: 'clientId',
                        foreignField: '_id',
                        as: 'clientDetails'
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

            // pagination MUST come after search
            pipeline.push(
                { $skip: skip },
                { $limit: limit }
            );

            const clientServices = await ClientService.aggregate(pipeline);

            const count = await ClientService.countDocuments(query);
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: {
                    clientServices,
                    count,
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

}