const { validationResult } = require("express-validator");
const { ResponseCodes } = require("../utils/constant");
// const Client = require("../models/ClientSchema");
const { Op, where } = require("sequelize");
const { Client, User } = require("../models/IndexAssociation");
module.exports = {
    /*
   * @route POST /api/v1/mysdom/client/add
   * @desc Add a new client
   * @desc Login a new user
   * @authentication  true [admin]
   */
    addClient: async (req, res) => {
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
                where: {
                    [Op.or]: [
                        { contactEmail: contactEmail },
                        { companyName: companyName }
                    ]
                }
            });
            if (existingClient) {
                return res.status(ResponseCodes.CONFLICT).json({
                    status: ResponseCodes.CONFLICT,
                    data: {},
                    error: 'Client with same email or company name already exists',
                    message: 'Client with same email or company name already exists'
                });
            }
            function generateNextCode(lastCode) {
                const prefix = "MYSDOM";
                let lastNumber = 0;

                if (lastCode) {
                    const num = parseInt(lastCode.slice(-5));
                    lastNumber = isNaN(num) ? 0 : num;
                }

                const nextNumber = String(lastNumber + 1).padStart(5, "0");
                const year = new Date().getFullYear();
                return `${prefix}${year}${nextNumber}`;
            }
            const lastCode = await Client.findAll({ paranoid: false, order: [['createdAt', 'desc']],limit:1,raw:true});
            // console.log('last:',lastCode[0].clientCode,generateNextCode(lastCode[0].clientCode))
            //let create new client
            const newClient = {
                companyName,
                clientCode:generateNextCode(lastCode.length?lastCode[0].clientCode:null), 
                contactEmail,
                contactPhone,
                address,
                slaDays,
                createdBy: req.user.id,
                updatedBy: req.user.id
            };
            const createdClient = await Client.create(newClient);
            return res.status(ResponseCodes.CREATED).json({
                status: ResponseCodes.CREATED,
                data: createdClient,
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
    updateClient: async (req, res) => {
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
            const inputData = { id, companyName, contactEmail, contactPhone, address, slaDays } = req.body;

            // let check id exist or not
            const checkClient = await Client.findOne({ where: { id: id }, raw: true });
            if (!checkClient) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    message: 'Client not found'
                });
            }
            //let check if client with same email or company name already exists
            const existingClient = await Client.findOne({
                where: {
                    [Op.or]: [
                        { contactEmail: contactEmail },
                        { companyName: companyName }
                    ],
                    id: { [Op.ne]: id },

                },
                raw: true
            });
            if (existingClient) {
                return res.status(ResponseCodes.CONFLICT).json({
                    status: ResponseCodes.CONFLICT,
                    data: {},
                    error: 'Client with same email or company name already exists',
                    message: 'Client with same email or company name already exists'
                });
            }
            //let update client
            delete inputData.id;
            inputData.updatedBy = req.user.id;
            await Client.update(
                inputData,
                { where: { id: id } }
            );
            const updatedClient = await Client.findOne({ where: { id: id }, raw: true });
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
    getClients: async (req, res) => {
        console.log('Get Clients API.....');
        try {

            let { search, page, limit } = req.query;
            let searchQuery = {};
            if (search) {
                searchQuery = {
                    [Op.or]: [
                        { companyName: { [Op.like]: `%${search}%` } },
                        { contactEmail: { [Op.like]: `%${search}%` } },
                        { contactPhone: { [Op.like]: `%${search}%` } }
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
            const clients = await Client.findAll(
                {
                    where: {
                        ...searchQuery
                    },
                    limit: limit,
                    offset: skip,
                    order: [['companyName', 'asc']],
                    include: [
                        {
                            model: User,
                            as: 'users',
                            attributes: ['username', 'email', 'phone', 'role', 'client', 'profilePicture']
                        }
                    ]
                }
            );
            const count = await Client.count({
                where: {
                    ...searchQuery
                }
            });
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
    getClientById: async (req, res) => {
        console.log('Get Client By ID API.....');
        try {
            const { id } = req.params;
            const client = await Client.findOne({
                where: { id: id }, include: [
                    {
                        model: User,
                        as: 'users',
                        attributes: ['username', 'email', 'phone', 'role', 'client', 'profilePicture']
                    }
                ]
            });
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
    /*
    * @route POST /api/v1/mysdom/client/add
    * @desc Get new client
    * @authentication  true [admin]
    */
    getAllClients: async (req, res) => {
        console.log('Get All Clients API.....');
        try {
            const clients = await Client.findAll(
                {
                    where: {
                        isActive: true
                    },
                    order: [['companyName', 'asc']],
                    raw: true
                }
            );
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: clients,
                message: 'Clients fetched successfully'
            });
        }
        catch (error) {
            console.error('Error in Get All Clients:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },
     /*
    * @route GET /api/v1/mysdom/client/users
    * @desc Get new client
    * @authentication  true [admin]
    */
    getClientUser: async(req,res)=>{
        console.log('getClientUser api..');
        try{
            let {clientid} = req.query;
            if(!clientid){
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status:ResponseCodes.NOT_FOUND,
                    data:{},
                    error:{message:"clientid required"},
                    message:"clientid required"
                })
            }
            let getUsers = await User.findAll({
                where:{
                    client:clientid,
                },
                include:[
                    {
                        model:Client,
                        as:'clients'
                    }
                ],
                order:[['username','asc']],
                raw:true
            });
            return res.status(ResponseCodes.SUCCESS).json({
                status:ResponseCodes.SUCCESS,
                data:getUsers,
                error:{},
                message:"User fetched successfully"
            })

        }
        catch(error){
             console.error('Error in Get All Clients:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    },
     /*
    * @route GET /api/v1/mysdom/client/user/delete
    * @desc Get new client
    * @authentication  true [admin]
    */
    deleteClient:async(req,res)=>{
        console.log("delete client api...");
        try{
            const validationErrors = validationResult(req);
            if (!validationErrors.isEmpty()) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    errors: validationErrors.array(),
                    message: 'Validation failed'
                });
            }
            let {id}=req.body;
            let client = await Client.findOne({
                where:{
                    id:id
                },
                raw:true
            });
            if(!client){
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status:ResponseCodes.NOT_FOUND,
                    data:{},
                    error:{
                        message:"Client not found check id."
                    },
                    message:"Clien not found"
                })
            }
            let deleteClient = await Client.destroy({
                where:{
                    id:id
                }
            });
            let deletedClient = await Client.findOne({
                where:{
                    id:id,
                    deletedAt:{[Op.ne]:null}
                },
                raw:true
            });
            return res.status(ResponseCodes.SUCCESS).json({
                status:ResponseCodes.SUCCESS,
                data:deleteClient,
                error:{},
                message:"Client delete successfull."
            })

        }
        catch(error){
             console.error('Error in Get All Clients:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
            });
        }
    }



}