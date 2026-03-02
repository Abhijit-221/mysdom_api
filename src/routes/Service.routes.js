const router = require('express').Router();
const { body } = require('express-validator');
const ServiceController = require('../controllers/Service.controller');
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/roleMiddleware");

// Validation middleware for adding a client
const addServiceValidation = [
    body('name').trim().notEmpty().isString().withMessage('Service name is required'),
    body('description').trim().notEmpty().isString().withMessage('Service description is required')
];

const updateServiceValidation = [
    body('id').trim().notEmpty().withMessage('Service ID is required'),
    body('name').optional({ checkFalsy: true }).trim().isString().withMessage('Invalid service name'),
    body('description').optional({ checkFalsy: true }).trim().isString().withMessage('Invalid service description'),
    body('isActive').optional({ checkFalsy: true }).isBoolean().withMessage('Invalid service isActive value')
];

// Route to add a new service
router.post('/add', auth, authorize('admin', 'superadmin'), addServiceValidation, ServiceController.addService);
router.get('/list', auth, authorize('admin', 'user', 'superadmin'), ServiceController.getServiceList);
router.get('/:id', auth, authorize('admin', 'user', 'superadmin'), ServiceController.getServiceById);
router.put('/update', auth, authorize('admin', 'superadmin'),updateServiceValidation, ServiceController.updateService);
router.get('/get', auth, authorize('admin', 'superadmin','user'),updateServiceValidation, ServiceController.getServices);

// router.delete('/delete/:id', auth, authorize('admin','superadmin'), ServiceController.deleteService);

module.exports = router;