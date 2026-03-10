const { validationResult } = require("express-validator");
const { ResponseCodes } = require("../utils/constant");
const jwt = require('jsonwebtoken');
const fs = require('fs');
const Client = require("../models/ClientSchema");
const User = require("../models/UserSchema");
const bcrypt = require('bcryptjs');
const { Op } = require("sequelize");

module.exports = {
    /*
    * @route POST /api/auth/register
    * @desc Register a new Admin
    * @authentication 
    */
    register: async (req, res) => {
        console.log('Registering API.....'); 
        try {
            const validationError = validationResult(req);
            if (!validationError.isEmpty()) {
            return res.status(ResponseCodes.BAD_REQUEST).json({ 
                success: ResponseCodes.BAD_REQUEST,
                errors: validationError.array(),
                message: 'Validation failed' 
            });
            }
            const { username, email, password } = req.body;
            // Validate input
            let checkEmail = await User.findOne({ 
                where: { email },
                raw: true
             });
            if (checkEmail) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: 'Email already exists',
                    message: 'Email already exists'
                });
            }
            let hashpassword = await bcrypt.hash(password, 12);
            //let create new user
            let newUser = await User.create({ username, email, password: hashpassword,role: 'superadmin' });
            return res.status(ResponseCodes.CREATED).json({
                status: ResponseCodes.CREATED,
                data: newUser,
                error: null,
                message: 'User registered successfully'
            });
            

        } catch (error) {
            console.error('Error in register controller:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
                });
        }
    },
    /*
    * @route POST /api/auth/register
    * @desc Login a new user
    * @authentication 
    */
    login: async (req, res) => {
        console.log('Login API.....');
        try {
            const validationError = validationResult(req);
            if (!validationError.isEmpty()) {
            return res.status(ResponseCodes.BAD_REQUEST).json({ 
                success: ResponseCodes.BAD_REQUEST,
                errors: validationError.array(),
                message: 'Validation failed' 
            });
            }
            const { email, password } = req.body;
            //let check user exist or not
            let user = await User.findOne({
                where: { email },
                raw: true
            });
            console.log(user)
            if (!user) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: 'Invalid email',
                    message: 'Invalid email'
                });
            }
                // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: 'Invalid password',
                    message: 'Invalid password'
                });
            }
                // Generate JWT token
            const token = await jwt.sign({ id: user.id,role:user.role,email:user.email }, process.env.JWT_SECRET, { expiresIn: '1D' });
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: { token,id: user.id,role:user.role,email:user.email,username:user.username },
                error: null,
                message: 'Login successful'
            });
        }
        catch (error) {
            console.error('Error in login controller:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
                });
        }
    },
    /*
    * @route POST /api/auth/register
    * @desc Login a new user
    * @authentication 
    */
   addUser: async (req,res)=>{
        console.log('Add User API.....');
        try {
            const validationError = validationResult(req);
            if (!validationError.isEmpty()) {
            return res.status(ResponseCodes.BAD_REQUEST).json({ 
                success: ResponseCodes.BAD_REQUEST,
                errors: validationError.array(),
                message: 'Validation failed' 
            });
            }
            const { username,email, password,role,client } = req.body;
            //let check user exist or not
            let user = await User.findOne({
                where: { email },
                raw: true
            });
            if (user) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: 'Email already exists',
                    message: 'Email already exists'
                });
            }
            //let check client exist or not
            if(role==='user' && !client){
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: 'Client ID is required for user role',
                    message: 'Client ID is required for user role'
                });
            }
            if(client){
                let checkClient = await Client.findOne({ 
                    where: { id:client },
                    raw: true
                 });
                if (!checkClient) {
                    return res.status(ResponseCodes.BAD_REQUEST).json({
                        status: ResponseCodes.BAD_REQUEST,
                        data: {},
                        error: 'Invalid client ID',
                        message: 'Invalid client ID'
                    });
                }
            }
            //let create new user
            let hashpassword = await bcrypt.hash(password, 12);
            let newUser = await User.create({username, email, password: hashpassword,role,...client && {client} });
            return res.status(ResponseCodes.CREATED).json({
                status: ResponseCodes.CREATED,
                data: newUser,
                error: null,
                message: 'User created successfully'
            });
        }
        catch (error) {
            console.error('Error in addUser controller:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
                });
        }
   },
   /*
    * @route POST /api/auth/register
    * @desc Login a new user
    * @authentication 
    */
   updateUser:async (req,res)=>{
        console.log('Update User API.....');
        try {
            let uploadedFilePath = req.file ? req.file : null;
            // console.log('Request file:', uploadedFilePath);
            const validationError = validationResult(req);
            if (!validationError.isEmpty()) {
                if(uploadedFilePath){
                    // Delete the uploaded file if validation fails
                    await fs.unlinkSync(uploadedFilePath.path);
                }
            return res.status(ResponseCodes.BAD_REQUEST).json({ 
                status: ResponseCodes.BAD_REQUEST,
                errors: validationError.array(),
                message: 'Validation failed' 
            });
            }
            const { id,username,phone,gender,isActive } = req.body;
            //let check user exist or not
            let user = await User.findOne({ where: { id:id},raw: true });
            if (!user) {
                if(uploadedFilePath){
                    // Delete the uploaded file if validation fails
                    await fs.unlinkSync(uploadedFilePath.path);
                }
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: 'User not found',
                    message: 'User not found'
                });
            }
            //let validate the update data must be updated by same user or admin
            if(!['superadmin','admin'].includes(req.user.role) && req.user._id.toString() !== id){
                if(uploadedFilePath){
                    // Delete the uploaded file if validation fails
                    await fs.unlinkSync(uploadedFilePath.path);
                }
                return res.status(ResponseCodes.FORBIDDEN).json({
                    status: ResponseCodes.FORBIDDEN,
                    data: {},
                    error: 'Unauthorized to update this user',
                    message: 'Unauthorized to update this user'
                });
            }
            //check if phone no already exists for other user
            if(phone){
                let checkPhone = await User.findOne({
                     where: { phone, id: { [Op.ne]: id } }
                    });
                if (checkPhone) {
                    if(uploadedFilePath){
                        // Delete the uploaded file if validation fails
                        await fs.unlinkSync(uploadedFilePath.path);
                    }
                    return res.status(ResponseCodes.BAD_REQUEST).json({
                        status: ResponseCodes.BAD_REQUEST,
                        data: {},
                        error: 'Phone number already exists',
                        message: 'Phone number already exists'
                    });
                }
            }
            let profilePicture = user.profilePicture;
            if(uploadedFilePath){
                profilePicture = uploadedFilePath.path;
            }
            let updateData = {
            ...(username && { username }),
            ...(phone && { phone }),
            ...(profilePicture && { profilePicture }),
            ...(gender && { gender }),
            isActive: ['superadmin','admin'].includes(req.user.role) ? isActive : user.isActive
            };
            //let update user
             await User.update(updateData, { where: { id } });
             let updatedUser = await User.findOne({ where: { id },raw: true });

            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: updatedUser,
                error: null,
                message: 'User updated successfully'
            });
        }
        catch (error) {
            console.error('Error in updateUser controller:', error);
            if(req.file){
                    // Delete the uploaded file if validation fails
                    await fs.unlinkSync(req.file.path);
                }
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
                });
        }
    },
    /**
     * @route GET /api/auth/users
     * @desc Get all users
     * @authentication
     */
    getAllUsers: async (req,res)=>{
        console.log('Get All Users API.....');
        try {
            let users,count=0;
            console.log('User role:', req.user.client);
            let {page,limit,search} = req.query;
            page = parseInt(page)||1,
            limit = parseInt(limit)||10;
            let skip = page*limit-limit;
            let searchquery = {};
            if(search){
                searchquery = {
                     [Op.or]: [
                        { username: { [Op.like]: `%${search}%` } },
                        { email: { [Op.like]: `%${search}%` } },
                        { role: { [Op.like]: `%${search}%` } }
                        // { role: { $regex: search, $options: 'i' } }
                    ]
                }
            }
            if(['admin','superadmin'].includes(req.user.role)){
                users = await User.findAll({where: {...searchquery },raw: true});
                count = await User.count({where: {...searchquery }});
            }else{
                users = await User.findAll({where: {client:req.user.client,...searchquery },raw: true});
                count = await User.count({where: {client:req.user.client,...searchquery }});
            }
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: {users,count},
                error: null,
                message: 'Users fetched successfully'
            });
        }
        catch (error) {
            console.error('Error in getAllUsers controller:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
                });
        }
    },
    /**
     * @route GET /api/auth/users/get/details
     * @desc Get all users
     * @authentication
     */

    getUserDetails: async(req,res)=>{
        try{

            let user_id = req.params.id;

            if(!user_id){
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status:ResponseCodes.BAD_REQUEST,
                    data:{},
                    error:"User id must be required",
                    message:"User id required."

                })
            }
            //let get user
            let user = await User.findOne({
                where: {
                    id:user_id,
                },
                raw: true
            });
            if(!user){
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status:ResponseCodes.NOT_FOUND,
                    data:{},
                    error:"User not found",
                    message:"User not found"
                })
            }
            return res.status(ResponseCodes.SUCCESS).json({
                status:ResponseCodes.SUCCESS,
                data:user,
                error:{},
                message:"User details fetched."
            })

        }
        catch(error){
            console.error('Error in getAllUsers controller:', error);
            return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
                status: ResponseCodes.INTERNAL_SERVER_ERROR,
                data: {},
                error: error.message,
                message: 'Server error'
                });
        }
    }
}