const router = require('express').Router();
const { body } = require('express-validator');
const bgvRequestController = require('../controllers/BGVRequest.controller');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadAny, uploadFields } = require('../middleware/uploadFile');

// Validation middleware for creating a BGV request
const createBGVRequestValidation = [
    // Top level fields
    body("client_id")
        .notEmpty()
        .withMessage("client_id is required")
        .isString()
        .withMessage("client_id must be a string"),

    body("assignedTo")
        .notEmpty()
        .withMessage("assignedTo is required")
        .isString()
        .withMessage("assignedTo must be a string"),

    body("slaDueDate")
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage("slaDueDate must be a valid date"),

    body("priority")
        .optional({ nullable: true })
        .isIn(["LOW", "MEDIUM", "HIGH"])
        .withMessage("priority must be LOW, MEDIUM or HIGH"),

    // Candidate object
    body("candidate.name")
        .notEmpty()
        .withMessage("Candidate name is required")
        .trim(),

    body("candidate.email")
        .notEmpty()
        .withMessage("Candidate email is required")
        .isEmail()
        .withMessage("Invalid email format"),

    body("candidate.phone")
        .notEmpty()
        .withMessage("Candidate phone is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number"),

    // Services array
    body("services")
        .isArray({ min: 1 })
        .withMessage("services must be an array with at least one service"),

    body("services.*.serviceId")
        .notEmpty()
        .withMessage("serviceId is required")
        .isString()
        .withMessage("serviceId must be a string"),
    body("services.*.form_data").custom(value => {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            throw new Error("form_data must be an object");
        }
        return true;
    })

//   body("services.*.form_data")
//     .notEmpty()
//     .withMessage("form_data is required")
//     .isObject()
//     .withMessage("form_data must be an object"),
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

let updateBGVStatusValidation = [
    body('request_id')
        .notEmpty()
        .withMessage("BGV request ID is required")
        .isString()
        .withMessage("BGV request ID must be a string"),
    body("service_id")
        .notEmpty()
        .withMessage("service ID is required")
        .isString()
        .withMessage("service ID must be a string"),
    body("status")
        .optional({ nullable: true })
        .isIn(['NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'REJECTED'])
        .withMessage("status must be NEW, IN_PROGRESS, ON_HOLD, COMPLETED, REJECTED"),
]

const createBgvRequestValidator = [

  /* CLIENT */

  body("clientId")
    .notEmpty()
    .withMessage("Client ID is required")
    .isUUID()
    .withMessage("Client ID must be a valid UUID"),

  /* CANDIDATE */

  body("candidate_name")
    .notEmpty()
    .withMessage("Candidate name is required")
    .isLength({ min: 2 })
    .withMessage("Candidate name must be at least 2 characters"),

  body("candidate_email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("candidate_phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("en-IN")
    .withMessage("Invalid phone number"),

  body("designation")
    .optional()
    .isString(),

  body("department")
    .optional()
    .isString(),

  /* IDENTITY */

  body("id_type")
    .optional()
    .isString(),

  body("id_number")
    .optional()
    .isString(),

  /* CURRENT ADDRESS */

  body("current_address")
    .optional()
    .isString(),

  body("current_landmark")
    .optional()
    .isString(),

  body("current_residency")
    .optional()
    .isString(),

  body("current_duration")
    .optional()
    .isString(),

  /* PERMANENT ADDRESS */

  body("permanent_address")
    .optional()
    .isString(),

  body("permanent_landmark")
    .optional()
    .isString(),

  body("permanent_residency")
    .optional()
    .isString(),

  body("permanent_duration")
    .optional()
    .isString(),

  /* CRIMINAL CHECK */

  body("father_name")
    .optional()
    .isString(),

  body("mother_name")
    .optional()
    .isString(),

  body("gender")
    .optional()
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("Invalid gender"),

  body("dob")
    .optional()
    .isDate()
    .withMessage("Invalid date format"),

  /* EMPLOYMENT */

  body("company_name")
    .optional()
    .isString(),

  body("employee_id")
    .optional()
    .isString(),

  body("employment_start")
    .optional()
    .isDate(),

  body("employment_end")
    .optional()
    .isDate(),

  body("job_title")
    .optional()
    .isString(),

  body("leaving_reason")
    .optional()
    .isString(),

  /* EDUCATION */

  body("institute_name")
    .optional()
    .isString(),

  body("university")
    .optional()
    .isString(),

  body("education_start")
    .optional()
    .isDate(),

  body("education_end")
    .optional()
    .isDate(),

  body("roll_number")
    .optional()
    .isString(),

  body("qualification")
    .optional()
    .isString(),

  body("specialization")
    .optional()
    .isString(),

  body("passing_year")
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage("Invalid passing year"),
  /* STATUS */

  body("status")
    .optional()
    .isIn(["NEW", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "REJECTED"])
    .withMessage("Invalid status"),

  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Invalid priority"),

  /* USERS */

  body("assignedTo")
    .optional()
    .isUUID()
    .withMessage("assignedTo must be UUID"),

  body("slaDueDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid SLA date"),
    body("service")
    .isArray({ min: 1 })
    .withMessage("Service must be a non-empty array"),

  body("service.*")
    .isUUID()
    .withMessage("assignedTo must be UUID"),
     body("assignedTo")
        .notEmpty()
        .withMessage("assignedTo is required")
        .isString()
        .withMessage("assignedTo must be a string"),

];

const applyFields = [
    { name: 'id_doc', maxCount: 1 },
    { name: 'job_doc', maxCount: 1 },
    { name: 'edu_doc', maxCount: 1 }
];
// Route to create a new BGV request
router.post('/create', auth, authorize('user'), uploadAny(), createBGVRequestValidation, bgvRequestController.create);

// Route to update an existing BGV request
router.put('/update', auth, authorize('admin', 'user'), updateBGVRequestValidation, bgvRequestController.updateBGVRequest);
router.get('/get', auth, authorize('superadmin','admin','user'), bgvRequestController.getBGVRequest);
router.put('/status/update', auth, authorize('admin','superadmin'), updateBGVStatusValidation, bgvRequestController.updateRequestStatus);
router.post('/apply', auth, authorize('user'), uploadFields(applyFields), createBgvRequestValidator, bgvRequestController.bgvReqCreate);



module.exports = router;