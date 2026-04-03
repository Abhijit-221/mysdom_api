const router = require('express').Router();
const { body } = require('express-validator');
const ServiceController = require('../controllers/Service.controller');
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/roleMiddleware");

// Validation middleware for adding a client
const addServiceValidation = [
    body('name').trim().notEmpty().isString().withMessage('Service name is required'),
    body('description').trim().notEmpty().isString().withMessage('Service description is required'),
    body('moredetails')
        .optional()
        .isObject()
        .withMessage('moredetails must be an object'),

    // detaildescription
    body('moredetails.detaildescription')
        .optional()
        .isString()
        .withMessage('detaildescription must be a string'),

    // keybenifits (array of strings)
    body('moredetails.keybenifits')
        .optional()
        .isArray()
        .withMessage('keybenifits must be an array'),

    body('moredetails.keybenifits.*')
        .optional()
        .isString()
        .withMessage('each key benefit must be a string'),

    // extradetailTitle
    body('moredetails.extradetailTitle')
        .optional()
        .isString()
        .withMessage('extradetailTitle must be a string'),

    // extradetailList
    body('moredetails.extradetailList')
        .optional()
        .isArray()
        .withMessage('extradetailList must be an array'),

    body('moredetails.extradetailList.*')
        .optional()
        .isString()
        .withMessage('each extra detail must be a string'),

    // frequentlyaskedquestions
    body('moredetails.frequentlyaskedquestions')
        .optional()
        .isArray()
        .withMessage('frequentlyaskedquestions must be an array'),

    body('moredetails.frequentlyaskedquestions.*.question')
        .optional()
        .isString()
        .withMessage('each FAQ question must be a string'),
    body('moredetails.frequentlyaskedquestions.*.answer')
    .optional()
    .isString()
    .withMessage('each FAQ answer must be a string'),

];

const updateServiceValidation = [
    body('id').trim().notEmpty().withMessage('Service ID is required'),
    body('name').optional({ checkFalsy: true }).trim().isString().withMessage('Invalid service name'),
    body('description').optional({ checkFalsy: true }).trim().isString().withMessage('Invalid service description'),
    body('isActive').optional({ checkFalsy: true }).isBoolean().withMessage('Invalid service isActive value'),
    body('moredetails')
        .optional()
        .isObject()
        .withMessage('moredetails must be an object'),

    // detaildescription
    body('moredetails.detaildescription')
        .optional()
        .isString()
        .withMessage('detaildescription must be a string'),

    // keybenifits (array of strings)
    body('moredetails.keybenifits')
        .optional()
        .isArray()
        .withMessage('keybenifits must be an array'),

    body('moredetails.keybenifits.*')
        .optional()
        .isString()
        .withMessage('each key benefit must be a string'),

    // extradetailTitle
    body('moredetails.extradetailTitle')
        .optional()
        .isString()
        .withMessage('extradetailTitle must be a string'),

    // extradetailList
    body('moredetails.extradetailList')
        .optional()
        .isArray()
        .withMessage('extradetailList must be an array'),

    body('moredetails.extradetailList.*')
        .optional()
        .isString()
        .withMessage('each extra detail must be a string'),

   body('moredetails.frequentlyaskedquestions')
        .optional()
        .isArray()
        .withMessage('frequentlyaskedquestions must be an array'),

    body('moredetails.frequentlyaskedquestions.*.question')
        .optional()
        .isString()
        .withMessage('each FAQ question must be a string'),
    body('moredetails.frequentlyaskedquestions.*.answer')
    .optional()
    .isString()
    .withMessage('each FAQ answer must be a string'),

];

// Route to add a new service
router.post('/add', auth, authorize('admin', 'superadmin'), addServiceValidation, ServiceController.addService);
router.get('/list',
    auth,
    authorize('admin', 'user', 'superadmin'),
    ServiceController.getServiceList
);
router.get('/getby/:id',
    auth,
    authorize('admin', 'user', 'superadmin'),
    ServiceController.getServiceById
);
router.put('/update', auth, authorize('admin', 'superadmin'), updateServiceValidation, ServiceController.updateService);
router.get('/get',
    auth, authorize('admin', 'superadmin', 'user'),
    ServiceController.getServices
);
router.get('/ext-list',
    ServiceController.getServiceListForExt
);
// router.delete('/delete/:id', auth, authorize('admin','superadmin'), ServiceController.deleteService);

module.exports = router;