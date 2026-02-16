const { validationResult } = require("express-validator");
const { ResponseCodes } = require("../utils/constant");
const ClientSchema = require("../models/ClientSchema");
const BGVRequestSchema = require("../models/BGVRequestSchema");
const UserSchema = require("../models/UserSchema");
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
            let { candidate,
                status,
                priority,
                assignedTo,
                slaDueDate } = req.body;
            //let check client exist or not
            let client = await ClientSchema.findOne({_id:req.user.client,is_deleted:false});
            if (!client) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: 'Client not found',
                    message: 'Client not found'
                });
            }
            //let check assigned to user exist or not
            let assignedToUser = await UserSchema.findOne({_id:assignedTo,role:'admin',is_deleted:false});
            if (!assignedToUser) {
                return res.status(ResponseCodes.NOT_FOUND).json({
                    status: ResponseCodes.NOT_FOUND,
                    data: {},
                    error: 'Assigned to user not found',
                    message: 'Assigned to user not found'
                });
            }
            //check BGV request exist or not
            let bgvRequest = await BGVRequestSchema.findOne({
                $or: [
                    { "candidate.email": candidate.email },
                    { "candidate.phone": candidate.phone }
                ],
                clientId:req.user.client,
                is_deleted:false});
                console.log('BGV request exist or not:', bgvRequest);
            if (bgvRequest) {
                return res.status(ResponseCodes.CONFLICT).json({
                    status: ResponseCodes.CONFLICT,
                    data: {},
                    error: 'BGV request already exists',
                    message: 'BGV request already exists'
                });
            }
            //create BGV request
            let newBGVRequest = new BGVRequestSchema({
                clientId: req.user.client,
                candidate,
                status,
                priority,
                submittedBy: req.user._id,
                assignedTo,
                slaDueDate
            });
            await newBGVRequest.save();
            return res.status(ResponseCodes.CREATED).json({
                status: ResponseCodes.CREATED,
                data: newBGVRequest,
                error: null,
                message: 'BGV request created successfully'
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
               
                let {id,
                    candidate,
                    status,
                    priority,
                    assignedTo,
                    slaDueDate } = req.body;
                //let check BGV request exist or not
                let bgvRequest = await BGVRequestSchema.findOne({
                    _id:id,
                    is_deleted:false,
                });
                if (!bgvRequest) {
                    return res.status(ResponseCodes.NOT_FOUND).json({
                        status: ResponseCodes.NOT_FOUND,
                        data: {},
                        error: 'BGV request not found',
                        message: 'BGV request not found'
                    });
                }
                if(req.user.role!=='admin' && bgvRequest.clientId.toString() !== req.user.client.toString()){
                    return res.status(ResponseCodes.UNAUTHORIZED).json({
                        status: ResponseCodes.UNAUTHORIZED,
                        data: {},
                        error: 'Unauthorized to update this BGV request',
                        message: 'Unauthorized to update this BGV request'
                    });
                }
                if(req.user.role==='user' && bgvRequest.submittedBy.toString() !== req.user._id.toString()){
                    return res.status(ResponseCodes.UNAUTHORIZED).json({
                        status: ResponseCodes.UNAUTHORIZED,
                        data: {},
                        error: 'Unauthorized to update this BGV request',
                        message: 'Unauthorized to update this BGV request'
                    });
                }
                if(assignedTo){
                    if(req.user.role!=='user'){
                        return res.status(ResponseCodes.UNAUTHORIZED).json({
                            status: ResponseCodes.UNAUTHORIZED,
                            data: {},
                            error: 'Unauthorized to update assignedTo field',
                            message: 'Unauthorized to update assignedTo field'
                        });
                    }
                    //let check assigned to user exist or not
                    let assignedToUser = await UserSchema.findOne({_id:assignedTo,role:'admin',is_deleted:false});
                    if (!assignedToUser) {
                        return res.status(ResponseCodes.NOT_FOUND).json({
                            status: ResponseCodes.NOT_FOUND,
                            data: {},
                            error: 'Assigned to user not found',
                            message: 'Assigned to user not found'
                        });
                    }
                    
                }
                if(candidate && candidate.email){
                    //check BGV request exist or not with same candidate email
                    let bgvRequestWithSameEmail = await BGVRequestSchema.findOne({
                           $or: [
                            { "candidate.email": candidate.email },
                            { "candidate.phone": candidate.phone }
                           ],
                            _id: { $ne: id },
                            clientId:req.user.client,
                            is_deleted:false});
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
                }, {new:true});
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
    }