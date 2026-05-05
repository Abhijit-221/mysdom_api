const router = require('express').Router();
const { body } = require('express-validator');
const bgvRequestController = require('../controllers/BGVRequest.controller');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadAny, uploadFields, uploadSingle } = require('../middleware/uploadFile');
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
  body("product_id")
    .notEmpty()
    .withMessage("product ID is required")
    .isString()
    .withMessage("product ID must be a string"),
  body("status")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['SUBMITED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'REJECTED', 'CLOSED'])
    .withMessage("status must be SUBMITED, IN_PROGRESS, ON_HOLD, COMPLETED, REJECTED or CLOSED"),
  body("verification_data")
    .optional()
    .isObject()
    .withMessage("verification_data must be an object"),
  body("verify_id_type")
    .optional()
    .isString()
    .withMessage("verify_id_type must be a string")
    .isLength(100),
  body("verify_id_number")
    .optional()
    .isString()
    .withMessage("verify_id_number must be a string")
    .isLength(45),
    // current address
   body("verify_current_address")
    .optional()
    .isString()
    .withMessage("verify_current_address must be a string"),
  body("verify_current_landmark")
    .optional()
    .isString()
    .withMessage("verify_current_landmark must be a string"),
  body("verify_current_residency")
    .optional()
    .isString()
    .withMessage("verify_current_residency must be a string")
    .isLength(50), 
  body("verify_current_duration")
    .optional()
    .isString()
    .withMessage("verify_current_duration must be a string")
    .isLength(30),
  // permanent address
  body("verify_permanent_address")
    .optional()
    .isString()
    .withMessage("verify_permanent_address must be a string"),
  body("verify_permanent_landmark")
    .optional()
    .isString()
    .withMessage("verify_permanent_landmark must be a string"),
  body("verify_permanent_residency")
    .optional()
    .isString()
    .withMessage("verify_permanent_residency must be a string")
    .isLength(50),
  body("verify_permanent_duration")
    .optional()
    .isString()
    .withMessage("verify_permanent_duration must be a string")
    .isLength(30),
  // Criminal check validate
  body("verify_father_name")
    .optional()
    .isString()
    .withMessage("verify_father_name must be a string"),
  body("verify_mother_name")
    .optional()
    .isString()
    .withMessage("verify_mother_name must be a string"),
  body("verify_address_detail")
    .optional()
    .isString()
    .withMessage("verify_address_detail must be a string"),
  body("verify_city")
    .optional()
    .isString()
    .withMessage("verify_city must be a string"),
  // Education validate
  body("verify_institute_name")
    .optional()
    .isString()
    .withMessage("verify_institute_name must be a string"),
  body("verify_university")
    .optional()
    .isString()
    .withMessage("verify_university must be a string"),
  body("verify_education_start")
    .optional()
    .isDate()
    .withMessage("verify_education_start must be a valid date"),
  body("verify_education_end")
    .optional()
    .isDate()
    .withMessage("verify_education_end must be a valid date"),
  body("verify_roll_number")
    .optional()
    .isString()
    .withMessage("verify_roll_number must be a string")
    .isLength(50),
  body("verify_qualification")
    .optional()
    .isString()
    .withMessage("verify_qualification must be a string"),
  body("verify_specialization")
    .optional()
    .isString()
    .withMessage("verify_specialization must be a string"),
  body("verify_passing_year")
    .optional()
    .isString()
    .withMessage("verify_passing_year must be a string"),
  body("verify_degree_status")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("verify_degree_status must be yes or no"),
  //credit check validate
  body("verify_pan_card")
    .optional()
    .isString()
    .withMessage("verify_pan_card must be a string"),
  //social media validate
  body("verify_social_media_type")
    .optional()
    .isString()
    .withMessage("verify_social_media_type must be a string"),
  body("verify_social_media_id")
    .optional()
    .isString()
    .withMessage("verify_social_media_id must be a string"),
  body("verify_nick_name")
    .optional()
    .isString()
    .withMessage("verify_nick_name must be a string"),
  //Employeement validate
  body("employeeDetails")
    .optional()
    .isArray()
    .withMessage("employeeDetails must be an array"),
  body("employeeDetails.*.id")
    .optional()
    .isUUID()
    .withMessage("employeeDetails id must be a valid UUID"),

  body("employeeDetails.*.verify_company_name")
    .notEmpty()
    .withMessage("verify_company_name is required")
    .isString()
    .withMessage("verify_company_name must be a string"),
  body("employeeDetails.*.verify_employee_id")
    .notEmpty()
    .withMessage("verify_employee_id is required")
    .isString()
    .withMessage("verify_employee_id must be a string"),
  body("employeeDetails.*.verify_employment_start")
    .optional()
    .isDate()
    .withMessage("verify_employment_start must be a valid date"),
  body("employeeDetails.*.verify_employment_end")
    .optional()
    .isDate()
    .withMessage("verify_employment_end must be a valid date"),
  body("employeeDetails.*.verify_isCurrent")
    .optional()
    .isBoolean()
    .withMessage("verify_isCurrent must be boolean"),
  body("employeeDetails.*.verify_job_title")
    .notEmpty()
    .withMessage("verify_job_title is required")
    .isString()
    .withMessage("verify_job_title must be a string"),
  body("employeeDetails.*.verify_leaving_reason")
    .optional()
    .isString()
    .withMessage("verify_leaving_reason must be a string"),
  body("employeeDetails.*.verify_employment_category")
    .optional()
    .isString()
    .withMessage("verify_employment_category must be a string"),
  body("employeeDetails.*.verify_employment_type")
    .optional()
    .isString()
    .withMessage("verify_employment_type must be a string"),
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

  body("gender")
    .optional()
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("Invalid gender"),

  body("dob")
    .optional()
    .isDate()
    .withMessage("Invalid date format"),


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
  body("address_detail")
    .optional()
    .isString(),
  body('city')
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
  body("degree_status")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("degree_status must be yes or no"),
  /* STATUS */

  body("status")
    .optional({ checkFalsy: true })
    .isIn(["NEW", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "REJECTED"])
    .withMessage("Invalid status"),

  body("priority")
    .optional({ checkFalsy: true })
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Invalid priority"),
  /**CREDIT CHECK */
  body("pan_card")
    .optional({ checkFalsy: true })
    .isString(),
  /**SOCIAL MEDIA */
  body("social_media_type")
    .optional({ checkFalsy: true })
    .isString(),
  body("social_media_id")
    .optional({ checkFalsy: true })
    .isString(),
  body("nick_name")
    .optional({ checkFalsy: true })
    .isString(),
  /* USERS */

  body("assignedTo")
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage("assignedTo must be UUID"),

  body("slaDueDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid SLA date"),
  body("products")
    .isArray({ min: 1 })
    .withMessage("Products must be a non-empty array"),

  body("products.*")
    .isUUID()
    .withMessage("Products must be UUID"),
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
  body("bgvEmployments.*.employment_category")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Invalid employment category"),
  body("bgvEmployments.*.employment_type")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Invalid employment type"),
  body("acknowladge")
  .notEmpty().withMessage("acknowladge is required")
  .toBoolean() // ✅ converts "true"/"false" → true/false
  .isBoolean()
  .withMessage("acknowladge must be boolean")

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
  parseJSONFields(["verification_data"]),
  updateBGVStatusValidation,
  bgvRequestController.updateRequestStatus
);

router.post('/apply', auth, authorize('user'), uploadAny(), createBgvRequestValidator, bgvRequestController.bgvReqCreate);
router.get('/getby/:request_id', auth, authorize('superadmin', 'admin', 'user'), bgvRequestController.getBGVRequestById);
router.post('/bulk-upload', auth, authorize('user'), uploadSingle("batch_upload"), bgvRequestController.uploadCandidates);


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
  uploadAny(), parseJSONFields(["bgvEmployments", "removeEmployments", "addservice", "removeService"]),
  updateBGVRequestValidation,
  bgvRequestController.updateBGVRequest
);
router.post('/batchupload/service-add',
  auth,
  authorize('admin', 'superadmin'),
  bgvRequestController.createBatchUploadService
);
router.get('/batchupload/service-get',
  auth,
  authorize('user', 'admin', 'superadmin'),
  bgvRequestController.getBathUploadService
)

const validateForm = [
  body("products")
    .isArray({ min: 1 })
    .withMessage("Products must be a non-empty array"),

  body("products.*")
    .isUUID()
    .withMessage("Products must be UUID"),
]
router.post('/formlink',
  auth,
  authorize('user'),
  validateForm,
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
  body("gender")
    .optional()
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("Invalid gender"),

  body("dob")
    .optional()
    .isDate()
    .withMessage("Invalid date format"),

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

  body("address_detail")
    .optional()
    .isString(),
  body('city')
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
  body("degree_status")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("degree_status must be yes or no"),
  /* STATUS */

  body("status")
    .optional({ checkFalsy: true })
    .isIn(["NEW", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "REJECTED"])
    .withMessage("Invalid status"),

  body("priority")
    .optional({ checkFalsy: true })
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Invalid priority"),

  /**CREDIT CHECK */
  body("pan_card")
    .optional({ checkFalsy: true })
    .isString(),
  /**SOCIAL MEDIA */
  body("social_media_type")
    .optional({ checkFalsy: true })
    .isString(),
  body("social_media_id")
    .optional({ checkFalsy: true })
    .isString(),
  body("nick_name")
    .optional({ checkFalsy: true })
    .isString(),
  /* USERS */

  body("assignedTo")
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage("assignedTo must be UUID"),

  body("slaDueDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid SLA date"),

  //social media check
  body("social_media_type")
    .optional({ checkFalsy: true })
    .isString(),
  body("social_media_id")
    .optional({ checkFalsy: true })
    .isString(),
  body("nick_name")
    .optional({ checkFalsy: true })
    .isString(),

  //products
  body("products")
    .isArray({ min: 1 })
    .withMessage("Products must be a non-empty array"),

  body("products.*")
    .isUUID()
    .withMessage("Products must be UUID"),


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
  body("bgvEmployments.*.employment_category")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Invalid employment category"),
  body("bgvEmployments.*.employment_type")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Invalid employment type"),
  body("acknowladge")
  .notEmpty().withMessage("acknowladge is required")
  .toBoolean() // ✅ converts "true"/"false" → true/false
  .isBoolean()
  .withMessage("acknowladge must be boolean")
];

router.post('/user/form/apply', uploadAny(), bgvReqApplyValidation, bgvRequestController.bgvUserApplyForm);

module.exports = router;
