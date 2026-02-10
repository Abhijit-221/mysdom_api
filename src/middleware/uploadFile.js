const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'public';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log('Determining upload destination for file:', file);
    // You can set different destinations based on file type
    let uploadPath = uploadDir;
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(uploadDir, `${file.fieldname}s`); // e.g., static/images
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = path.join(uploadDir, 'videos');
    } else if (file.mimetype === 'application/pdf') {
      uploadPath = path.join(uploadDir, 'documents');
    } else {
      uploadPath = path.join(uploadDir, 'others');
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/mpeg',
    'video/quicktime'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed.`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
});

// Custom error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    // Other errors (like file filter errors)
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Export different upload configurations
module.exports = {
  // Single file upload
  uploadSingle: (fieldName) => upload.single(fieldName),
  
  // Multiple files with same field name
  uploadMultiple: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount),
  
  // Multiple files with different field names
  uploadFields: (fields) => upload.fields(fields),
  // Example: uploadFields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 5 }])
  
  // Any files
  uploadAny: () => upload.any(),
  
  // Error handler
  handleMulterError,
  
  // Custom middleware for additional validation
  validateUpload: (req, res, next) => {
    console.log('Validating uploaded files...');
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.'
      });
    }
    next();
  }
};