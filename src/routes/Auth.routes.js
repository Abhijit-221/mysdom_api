// routes/auth.js
const express = require('express');
const Authrouter = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/Auth.controller');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadSingle } = require('../middleware/uploadFile');

// Validation middleware
const registerValidation = [
  body('username')
    .trim()                                    // First, trim whitespace
    .notEmpty()                                // Then check if empty
    .withMessage('Username is required')       // Error for empty
    .isLength({ min: 3 })                      // Then check length
    .withMessage('Username must be at least 3 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];


const loginValidation = [
  body('email').trim().notEmpty().isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const addUserValidation = [
  body('username').trim().notEmpty().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').trim().notEmpty().isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').trim().notEmpty().withMessage('Password is required'),
  body('role').trim().notEmpty().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  body('client').optional({ checkFalsy: true })
  .trim()
  .isMongoId()
  .withMessage('Invalid client ID'),
];
const updateUserValidation = [
  body('id')
  .trim()
  .notEmpty()
  .withMessage('Invalid user ID'),

body('username')
  .optional({ checkFalsy: true })
  .trim()
  .isLength({ min: 3 })
  .withMessage('Username must be at least 3 characters'),

body('phone')
  .optional({ checkFalsy: true })
  .trim()
  .isEmail()
  .normalizeEmail()
  .withMessage('Invalid email'),

body('gender')
  .optional({ checkFalsy: true })
  .trim()
  .isIn(['male', 'female', 'other'])
  .withMessage('Invalid gender'),

];

// Public routes
Authrouter.post('/register', registerValidation, authController.register);
Authrouter.post('/login', loginValidation, authController.login);
Authrouter.post('/user-add', auth,authorize('superadmin','admin'), addUserValidation, authController.addUser);
Authrouter.post('/user-update', auth,authorize('superadmin','admin','user'), uploadSingle('profile_pic'), updateUserValidation, authController.updateUser);

// // Protected routes
Authrouter.get('/user-list', auth,authorize('superadmin','admin','user'),authController.getAllUsers);

module.exports = Authrouter;