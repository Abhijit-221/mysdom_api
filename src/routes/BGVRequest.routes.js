const router = require('express').Router();
const { body } = require('express-validator');
const bgvRequestController = require('../controllers/BGVRequest.controller');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadAny, uploadFields, uploadSingle } = require('../middleware/uploadFile');

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
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'REJECTED','CLOSED'])
    .withMessage("status must be NEW, IN_PROGRESS, ON_HOLD, COMPLETED, REJECTED or CLOSED"),
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
    .trim()
    .isString(),

  body("id_number")
    .optional()
    .trim()
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
    .optional({ checkFalsy: true })
    .isString(),

  body("qualification")
    .optional({ checkFalsy: true })
    .isString(),

  body("specialization")
    .optional({ checkFalsy: true })
    .isString(),

  body("passing_year")
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage("Invalid passing year"),
  /* STATUS */

  body("status")
    .optional({ checkFalsy: true })
    .isIn(["NEW", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "REJECTED"])
    .withMessage("Invalid status"),

  body("priority")
    .optional({ checkFalsy: true })
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Invalid priority"),

  /* USERS */

  body("assignedTo")
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage("assignedTo must be UUID"),

  body("slaDueDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid SLA date"),
  body("service")
    .isArray({ min: 1 })
    .withMessage("Service must be a non-empty array"),

  body("service.*")
    .isUUID()
    .withMessage("service must be UUID"),
  // body("assignedTo")
  //   .notEmpty()
  //   .withMessage("assignedTo is required")
  //   .isString()
  //   .withMessage("assignedTo must be a string"),

  //bgv employeement ----

  body("bgvEmployments")
    .optional({ checkFalsy: true })
    .isArray()
    .withMessage("Employment must be an array"),

  body("bgvEmployments.*.company_name")
    .notEmpty()
    .withMessage("Company name is required"),

  body("bgvEmployments.*.employee_id")
    .notEmpty()
    .withMessage("Employee ID is required"),

  body("bgvEmployments.*.employment_start")
    .optional({ checkFalsy: true })
    .isDate()
    .withMessage("Invalid employment start date"),

  body("bgvEmployments.*.employment_end")
    .optional({ checkFalsy: true })
    .isDate()
    .withMessage("Invalid employment end date"),

  body("bgvEmployments.*.isCurrent")
    .optional({ checkFalsy: true })
    .isBoolean()
    .withMessage("isCurrent must be boolean"),

  body("bgvEmployments.*.job_title")
    .notEmpty({ checkFalsy: true })
    .withMessage('Job title must be required'),

  body("bgvEmployments.*.leaving_reason")
    .optional({ checkFalsy: true })
    .trim(),

];

const applyFields = [
  { name: 'id_doc', maxCount: 1 },
  { name: 'job_doc', maxCount: 1 },
  { name: 'edu_doc', maxCount: 1 }
];
// Route to create a new BGV request
router.post('/create', auth, authorize('user'), uploadAny(), createBGVRequestValidation, bgvRequestController.create);

// Route to update an existing BGV request
router.get('/get', auth, authorize('superadmin', 'admin', 'user'), bgvRequestController.getBGVRequest);

const bgvServiceStatusDocs = [
  { name: 'doc_1', maxCount: 1 },
  { name: 'doc_2', maxCount: 1 },
];
router.put('/status/update',
  auth, authorize('admin', 'superadmin'),
  uploadFields(bgvServiceStatusDocs),
  updateBGVStatusValidation, 
  bgvRequestController.updateRequestStatus
);

router.post('/apply', auth, authorize('user'), uploadAny(), createBgvRequestValidator, bgvRequestController.bgvReqCreate);
router.get('/getby/:request_id', auth, authorize('superadmin', 'admin', 'user'), bgvRequestController.getBGVRequestById);
router.post('/bulk-upload', auth, authorize('user'), uploadSingle("batch_upload"), bgvRequestController.uploadCandidates);
const parseJSONFields = (fields) => (req, res, next) => {
  fields.forEach((field) => {
    if (req.body[field]) {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch {
        req.body[field] = [];
      }
    }
  });
  next();
};

const updateBGVRequestValidation = [
  // Top level fields
  body("id")
    .notEmpty()
    .withMessage("id is required")
    .isString()
    .withMessage("id must be a string"),
  body("slaDueDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("slaDueDate must be a valid date"),

  // Candidate object
  body("candidate_name")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("Candidate name should be a string")
    .trim(),

  body("candidate_email")
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage("Invalid email format"),

  body("candidate_phone")
    .optional({ nullable: true, checkFalsy: true })
    .isMobilePhone("en-IN")
    .withMessage("Invalid phone number"),
  body("designation")
    .optional()
    .isString(),

  body("department")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  /* IDENTITY */

  body("id_type")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString(),

  body("id_number")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString(),

  /* CURRENT ADDRESS */

  body("current_address")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("current_landmark")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("current_residency")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("current_duration")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  /* PERMANENT ADDRESS */

  body("permanent_address")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("permanent_landmark")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("permanent_residency")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("permanent_duration")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  /* CRIMINAL CHECK */

  body("father_name")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("mother_name")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("gender")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("Invalid gender"),

  body("dob")
    .optional({ nullable: true, checkFalsy: true })
    .isDate()
    .withMessage("Invalid date format"),
  /* EDUCATION */

  body("institute_name")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("university")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("education_start")
    .optional({ nullable: true, checkFalsy: true })
    .isDate(),

  body("education_end")
    .optional({ nullable: true, checkFalsy: true })
    .isDate(),

  body("roll_number")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("qualification")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("specialization")
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body("passing_year")
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1900, max: 2100 })
    .withMessage("Invalid passing year"),
  
  body("priority")
    .if((value) => value)
    .toUpperCase()
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Invalid priority"),
  /* USERS */

  body("assignedTo")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("assignedTo must be UUID"),
  body("addservice")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error();
      } else if (!Array.isArray(value)) {
        throw new Error();
      }
      return true;
    })
    .withMessage("Service must be an array"),

  body("addservice.*")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("service must be UUID"),
  body("removeService")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error();
      } else if (!Array.isArray(value)) {
        throw new Error();
      }
      return true;
    }).withMessage("remove service must be a non-empty array"),
  body("removeService.*")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("service must be UUID"),
 
  //bgv employeement ----

  body("bgvEmployments")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error();
      } else if (!Array.isArray(value)) {
        throw new Error();
      }
      return true;
    }).withMessage("Employment must be an array"),

  body("bgvEmployments.*.company_name")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("Company name is required"),

  body("bgvEmployments.*.employee_id")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("Employee ID is required"),

  body("bgvEmployments.*.employment_start")
    .optional({ nullable: true, checkFalsy: true })
    .isDate()
    .withMessage("Invalid employment start date"),

  body("bgvEmployments.*.employment_end")
    .optional({ nullable: true, checkFalsy: true })
    .isDate()
    .withMessage("Invalid employment end date"),

  body("bgvEmployments.*.isCurrent")
    .optional({ nullable: true, checkFalsy: true })
    .isBoolean()
    .withMessage("isCurrent must be boolean"),

  body("bgvEmployments.*.job_title")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Job title must be string'),

  body("bgvEmployments.*.leaving_reason")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body("removeEmployments")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error();
      } else if (!Array.isArray(value)) {
        throw new Error();
      }
      return true;
    }).withMessage("Employment must be an array"),

  body("removeEmployments.*.id")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("remove employement id must be uuid"),

];
router.put('/update',
   auth,
   authorize('admin', 'user'), 
   uploadAny(),parseJSONFields(["bgvEmployments","removeEmployments","addservice","removeService"]), 
   updateBGVRequestValidation, 
   bgvRequestController.updateBGVRequest
  );
router.post('/batchupload/service-add',
  auth,
  authorize('admin','superadmin'),
  bgvRequestController.createBatchUploadService 
);
router.get('/batchupload/service-get',
  auth,
  authorize('user','admin','superadmin'),
  bgvRequestController.getBathUploadService
)

router.get('/formlink',
  auth,
  authorize('user'),
  bgvRequestController.generateFormLink
)

router.get('/token/verify/:token',
  bgvRequestController.verifyToken
);


const bgvReqApplyValidation = [

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
    .trim()
    .isString(),

  body("id_number")
    .optional()
    .trim()
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
    .optional({ checkFalsy: true })
    .isString(),

  body("qualification")
    .optional({ checkFalsy: true })
    .isString(),

  body("specialization")
    .optional({ checkFalsy: true })
    .isString(),

  body("passing_year")
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage("Invalid passing year"),
  /* STATUS */

  body("status")
    .optional({ checkFalsy: true })
    .isIn(["NEW", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "REJECTED"])
    .withMessage("Invalid status"),

  body("priority")
    .optional({ checkFalsy: true })
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Invalid priority"),

  /* USERS */

  body("assignedTo")
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage("assignedTo must be UUID"),

  body("slaDueDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid SLA date"),
  // body("service")
  //   .isArray({ min: 1 })
  //   .withMessage("Service must be a non-empty array"),

  // body("service.*")
  //   .isUUID()
  //   .withMessage("service must be UUID"),
  // body("assignedTo")
  //   .notEmpty()
  //   .withMessage("assignedTo is required")
  //   .isString()
  //   .withMessage("assignedTo must be a string"),

  //bgv employeement ----

  body("bgvEmployments")
    .optional({ checkFalsy: true })
    .isArray()
    .withMessage("Employment must be an array"),

  body("bgvEmployments.*.company_name")
    .notEmpty()
    .withMessage("Company name is required"),

  body("bgvEmployments.*.employee_id")
    .notEmpty()
    .withMessage("Employee ID is required"),

  body("bgvEmployments.*.employment_start")
    .optional({ checkFalsy: true })
    .isDate()
    .withMessage("Invalid employment start date"),

  body("bgvEmployments.*.employment_end")
    .optional({ checkFalsy: true })
    .isDate()
    .withMessage("Invalid employment end date"),

  body("bgvEmployments.*.isCurrent")
    .optional({ checkFalsy: true })
    .isBoolean()
    .withMessage("isCurrent must be boolean"),

  body("bgvEmployments.*.job_title")
    .notEmpty({ checkFalsy: true })
    .withMessage('Job title must be required'),

  body("bgvEmployments.*.leaving_reason")
    .optional({ checkFalsy: true })
    .trim(),

];

router.post('/user/form/apply',uploadAny(),bgvReqApplyValidation,bgvRequestController.bgvUserApplyForm);

module.exports = router;