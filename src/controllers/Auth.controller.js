const { validationResult } = require("express-validator");
const UserSchema = require("../models/UserSchema");
const { ResponseCodes } = require("../utils/constant");
const jwt = require('jsonwebtoken');
const fs = require('fs');

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
            let checkEmail = await UserSchema.findOne({ email,is_deleted: false });
            if (checkEmail) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: 'Email already exists',
                    message: 'Email already exists'
                });
            }
            //let create new user
            let newUser = await UserSchema.create({ username, email, password,role: 'admin' });
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
            let user = await UserSchema.findOne({ email,is_deleted: false });
            if (!user) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: 'Invalid email or password',
                    message: 'Invalid email or password'
                });
            }
                // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: 'Invalid email or password',
                    message: 'Invalid email or password'
                });
            }
                // Generate JWT token
            const token = await jwt.sign({ id: user._id,role:user.role,email:user.email }, process.env.JWT_SECRET, { expiresIn: '1D' });
            return res.status(ResponseCodes.SUCCESS).json({
                status: ResponseCodes.SUCCESS,
                data: { token,_id: user._id,role:user.role,email:user.email,username:user.username },
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
            const { username,email, password,role } = req.body;
            //let check user exist or not
            let user = await UserSchema.findOne({ email,is_deleted: false });
            if (user) {
                return res.status(ResponseCodes.BAD_REQUEST).json({
                    status: ResponseCodes.BAD_REQUEST,
                    data: {},
                    error: 'Email already exists',
                    message: 'Email already exists'
                });
            }
            //let create new user
            let newUser = await UserSchema.create({username, email, password,role });
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
                success: ResponseCodes.BAD_REQUEST,
                errors: validationError.array(),
                message: 'Validation failed' 
            });
            }
            const { id,username,phone,gender,isActive } = req.body;
            //let check user exist or not
            let user = await UserSchema.findOne({ _id:id,is_deleted: false });
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
            if(req.user.role !== 'admin' && req.user._id.toString() !== id){
                if(uploadedFilePath){
                    // Delete the uploaded file if validation fails
                    await fs.unlinkSync(uploadedFilePath.path);
                }
                return res.status(ResponseCodes.UNAUTHORIZED).json({
                    status: ResponseCodes.UNAUTHORIZED,
                    data: {},
                    error: 'Unauthorized to update this user',
                    message: 'Unauthorized to update this user'
                });
            }
            //check if phone no already exists for other user
            if(phone){
                let checkPhone = await UserSchema.findOne({ phone, _id: { $ne: id },is_deleted: false });
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
            isActive: req.user.role==='admin' ? isActive : user.isActive
            };
            //let update user
            let updatedUser = await UserSchema.findByIdAndUpdate(id, updateData, { new: true });
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




}