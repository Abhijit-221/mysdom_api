const router = require('express').Router();
const { body } = require('express-validator');
const ServiceController = require('../controllers/Service.controller');
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/roleMiddleware");
const ClientServiceController = require('../controllers/ClientSearvice.Controller');
// Validation middleware for adding a client
const addServiceValidation = [
    body('clientId').trim().notEmpty().isMongoId().withMessage('Client ID is required'),
    body('serviceId').trim().notEmpty().isMongoId().withMessage('Service ID is required'),
    body('tatDays').trim().notEmpty().isNumeric().withMessage('TAT Days must be a number')
];

// Route to add a new service
router.post('/add', auth, authorize('admin', 'superadmin', 'user'), addServiceValidation, ClientServiceController.addClientService);
router.get('/list', auth, authorize('admin', 'superadmin', 'user'), ClientServiceController.getClientServiceList);


module.exports = router;