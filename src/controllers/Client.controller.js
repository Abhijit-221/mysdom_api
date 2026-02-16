const { validationResult } = require("express-validator");
const { ResponseCodes } = require("../utils/constant");
const Client = require("../models/ClientSchema");
module.exports={
     /*
    * @route POST /api/v1/mysdom/client/add
    * @desc Add a new client
    * @desc Login a new user
    * @authentication  true [admin]
    */
    addClient:async (req,res)=>{
        console.log('Add Client API.....');
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
            const { companyName, contactEmail, contactPhone, address, slaDays } = req.body;
            //let check if client with same email or company name already exists
            const existingClient = await Client.findOne({ 
                $or: [
                    { contactEmail: contactEmail },
                    { companyName: companyName }
                ]
            });
            if (existingClient) {
                return res.status(ResponseCodes.CONFLICT).json({
                    status: ResponseCodes.CONFLICT,
                    data: {},
                    error: 'Client with same email or company name already exists',
                    message: 'Client with same email or company name already exists'
                });
            }
            //let create new client
            const newClient = new Client({
                companyName,
                contactEmail,
                contactPhone,
                address,
                slaDays,
                createdBy: req.user._id
            });
            await newClient.save();
            return res.status(ResponseCodes.CREATED).json({
                status: ResponseCodes.CREATED,
                data: newClient,
                message: 'Client added successfully'
            });
        }
        catch (error) {
            console.error('Error in Add Client:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },
    /*
    * @route POST /api/v1/mysdom/client/update
    * @desc update existing client
    * @authentication  true [admin]
    */
   updateClient:async (req,res)=>{
        console.log('Update Client API.....');
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
            const { id, companyName, contactEmail, contactPhone, address, slaDays } = req.body;
            //let check if client with same email or company name already exists
            const existingClient = await Client.findOne({ 
                $or: [
                    { contactEmail: contactEmail },
                    { companyName: companyName }
                ],
                _id: { $ne: id } // Exclude the current client being updated
            });
            if (existingClient) {
                return res.status(ResponseCodes.CONFLICT).json({
                    status: ResponseCodes.CONFLICT,
                    data: {},
                    message: 'Client with same email or company name already exists'
                });
            }
            //let update client
            const updatedClient = await Client.findByIdAndUpdate(
                id,
                {
                    companyName,
                    contactEmail,
                    contactPhone,
                    address,
                    slaDays,
                    updatedBy: req.user._id
                },
                
            );
            if (!updatedClient) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    message: 'Client not found'
                });
            }
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: updatedClient,
                message: 'Client updated successfully'
            });
        }
        catch (error) {
            console.error('Error in Update Client:', error);
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
    * @desc Get new client
    * @authentication  true [admin]
    */
   getClients:async (req,res)=>{
        console.log('Get Clients API.....');
        try {

            let {search,page,limit} = req.query;
            let searchQuery = {};
            if(search){
                searchQuery = {
                    $or: [
                        { companyName: { $regex: search, $options: 'i' } },
                        { contactEmail: { $regex: search, $options: 'i' } },
                        { contactPhone: { $regex: search, $options: 'i' } }
                    ]
                };
            }
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            const skip = (page - 1) * limit;

            // const clients = await Client.find({
            //     is_deleted: false,
            //     ...searchQuery
            // },).skip(skip).limit(limit).sort({ companyName: -1 }).populate('createdBy', 'username email');
            const clients = await Client.aggregate([
                { $match: { is_deleted: false, ...searchQuery } },
                { $sort: { companyName: -1 } },
                { $skip: skip },
                { $limit: limit },
                { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id',
                    pipeline:[
                        { $project: { username:1,email:1,phone:1,role:1,client:1,profilePicture:1 } }
                    ],
                    as: 'createdByDetails' } },
                { $unwind: '$createdByDetails' },
                { $lookup: { from: 'users', localField: '_id', foreignField: 'client',
                    pipeline:[
                        { $project: { username:1,email:1,phone:1,role:1,client:1,profilePicture:1 } }
                    ], as: 'users' } },

            ]); 
            const count = await Client.countDocuments({
                is_deleted: false,
                ...searchQuery
            },);
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: clients,
                count: count,
                message: 'Clients fetched successfully'
            });
        }
        catch (error) {
            console.error('Error in Get Clients:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },
    /*
    * @route GET /api/v1/mysdom/client/get/:id
    * @desc get  client by id
    * @authentication  true [admin]
    */
    getClientById:async (req,res)=>{
        console.log('Get Client By ID API.....');
        try {
            const { id } = req.params;
            const client = await Client.findOne({ _id: id, is_deleted: false });
            if (!client) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    message: 'Client not found'
                });
            }   
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: client,
                message: 'Client fetched successfully'
            });
        }
        catch (error) { 
            console.error('Error in Get Client By ID:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },


}