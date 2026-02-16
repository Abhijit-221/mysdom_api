const router = require('express').Router();
const { body } = require('express-validator');
const bgvRequestController = require('../controllers/BGVRequest.controller');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/roleMiddleware');

// Validation middleware for creating a BGV request
const createBGVRequestValidation = [
    body('candidate').notEmpty().withMessage('Candidate information is required'),
    body('candidate.name').notEmpty().withMessage('Candidate name is required'),
    body('candidate.email').notEmpty().isEmail().withMessage('Valid candidate email is required'),
    body('candidate.phone').notEmpty().withMessage('Candidate phone number is required'),
    body('status').optional().isIn(['NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED']).withMessage('Invalid status'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
    body('assignedTo').notEmpty().withMessage('Assigned to user is required').isMongoId().withMessage('Invalid user ID'),
    body('slaDueDate').notEmpty().isISO8601().toDate().withMessage('Invalid SLA due date')
];
const updateBGVRequestValidation = [
    body('id').notEmpty().withMessage('BGV request ID is required').isMongoId().withMessage('Invalid BGV request ID'),
    body('candidate').optional().notEmpty().withMessage('Candidate information cannot be empty'),
    body('candidate.name').optional().notEmpty().withMessage('Candidate name cannot be empty'),
    body('candidate.email').optional().notEmpty().isEmail().withMessage('Valid candidate email is required'),
    body('candidate.phone').optional().notEmpty().withMessage('Candidate phone number cannot be empty'),
    body('status').optional().isIn(['NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED']).withMessage('Invalid status'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
    body('assignedTo').optional().notEmpty().withMessage('Assigned to user cannot be empty').isMongoId().withMessage('Invalid user ID'),
    body('slaDueDate').optional().notEmpty().isISO8601().toDate().withMessage('Invalid SLA due date')
];

// Route to create a new BGV request
router.post('/create', auth, authorize('user'), createBGVRequestValidation, bgvRequestController.create);

// Route to update an existing BGV request
router.put('/update', auth, authorize('admin','user'), updateBGVRequestValidation, bgvRequestController.updateBGVRequest);
router.put('/service/add', auth, authorize('user'), updateBGVRequestValidation, bgvRequestController.addBGVRequestServices);



module.exports = router;