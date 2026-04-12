const express = require("express");
const router = express.Router();
const clientController = require("../controllers/Client.controller");
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/roleMiddleware");
const { body } = require("express-validator");

// Validation middleware for adding a client
const addClientValidation = [
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('contactEmail').trim().notEmpty().isEmail().normalizeEmail().withMessage('Valid contact email is required'),
    body('contactPhone').trim().notEmpty().withMessage('Contact phone is required'),
    body('address').optional().trim(),
    body('slaDays').optional().trim()
];
const updateClientValidation = [
    body('id')
        .trim()
        .notEmpty()
        .withMessage('Company name is required'),

    body('companyName')
        .optional({ checkFalsy: true })
        .trim()
        .isString()
        .withMessage('Invalid companyName'),

    body('contactEmail')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail()
        .withMessage('Invalid email')
        .normalizeEmail(),

    body('contactPhone')
        .optional({ checkFalsy: true })
        .trim()
        .isString()
        .withMessage('Invalid contact phone'),

    body('address')
        .optional({ checkFalsy: true })
        .trim()
        .isString()
        .withMessage('Invalid address'),

    body('slaDays')
        .optional()
        .isString()
        .withMessage('SLA days must be a string')

];

// Route to add a new client
router.post('/add', auth, authorize('admin', 'superadmin'), addClientValidation, clientController.addClient);
router.get('/get', auth, authorize('admin', 'superadmin',), clientController.getClients);
router.get('/get-all', auth, authorize('admin', 'superadmin',), clientController.getAllClients);
router.get('/get/:id', auth, authorize('admin', 'superadmin'), clientController.getClientById);
router.put('/update', auth, authorize('admin', 'superadmin'), updateClientValidation, clientController.updateClient);
router.get('/users/users/:clientid', auth, authorize('admin', 'superadmin'), clientController.getClientUser);

const deleteClientValidation = [
    body('id')
    .trim()
    .notEmpty().withMessage('id must be required')
    .isUUID()
];
router.post('/delete', auth, authorize('admin','superadmin'),deleteClientValidation, clientController.deleteClient);

module.exports = router;