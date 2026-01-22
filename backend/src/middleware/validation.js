import { body, param, query, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Auth validations
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  body('role')
    .isIn(['TEACHER', 'SCHOOL_ADMIN', 'COUNTRY_ADMIN', 'PARENT_STUDENT'])
    .withMessage('Invalid role'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export const validateRefreshToken = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  handleValidationErrors,
];

// Student validations
export const validateCreateStudent = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  body('studentIdNumber')
    .trim()
    .notEmpty()
    .withMessage('Student ID number is required'),
  body('schoolId').isUUID().withMessage('Valid school ID is required'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('classId')
    .optional()
    .isUUID()
    .withMessage('Class ID must be a valid UUID'),
  handleValidationErrors,
];

export const validateUpdateStudent = [
  param('id').isUUID().withMessage('Invalid student ID'),
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('classId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Class ID must be a valid UUID'),
  handleValidationErrors,
];

// Assessment validations
export const validateCreateAssessment = [
  body('studentId').isUUID().withMessage('Valid student ID is required'),
  body('learningOutcomeId')
    .isUUID()
    .withMessage('Valid learning outcome ID is required'),
  body('termId').isUUID().withMessage('Valid term ID is required'),
  body('assessmentDate')
    .isISO8601()
    .withMessage('Assessment date must be a valid date'),
  body('rating')
    .isIn(['EASILY_MEETING', 'MEETING', 'NEEDS_PRACTICE'])
    .withMessage('Rating must be EASILY_MEETING, MEETING, or NEEDS_PRACTICE'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters'),
  handleValidationErrors,
];

export const validateUpdateAssessment = [
  param('id').isUUID().withMessage('Invalid assessment ID'),
  body('rating')
    .optional()
    .isIn(['EASILY_MEETING', 'MEETING', 'NEEDS_PRACTICE'])
    .withMessage('Rating must be EASILY_MEETING, MEETING, or NEEDS_PRACTICE'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters'),
  body('assessmentDate')
    .optional()
    .isISO8601()
    .withMessage('Assessment date must be a valid date'),
  handleValidationErrors,
];

// Class validations
export const validateCreateClass = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Class name is required')
    .isLength({ max: 100 })
    .withMessage('Class name must not exceed 100 characters'),
  body('gradeLevel')
    .trim()
    .notEmpty()
    .withMessage('Grade level is required'),
  body('schoolId').isUUID().withMessage('Valid school ID is required'),
  body('academicYear')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required'),
  body('teacherId')
    .optional()
    .isUUID()
    .withMessage('Teacher ID must be a valid UUID'),
  handleValidationErrors,
];

export const validateUpdateClass = [
  param('id').isUUID().withMessage('Invalid class ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Class name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Class name must not exceed 100 characters'),
  body('gradeLevel')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Grade level cannot be empty'),
  body('teacherId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Teacher ID must be a valid UUID'),
  handleValidationErrors,
];

// School validations
export const validateCreateSchool = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('School name is required')
    .isLength({ max: 200 })
    .withMessage('School name must not exceed 200 characters'),
  body('countryId').isUUID().withMessage('Valid country ID is required'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('phone')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Phone must not exceed 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors,
];

// Term validations
export const validateCreateTerm = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Term name is required'),
  body('schoolYear')
    .trim()
    .notEmpty()
    .withMessage('School year is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('schoolId').isUUID().withMessage('Valid school ID is required'),
  handleValidationErrors,
];

// UUID param validation
export const validateUuidParam = (paramName = 'id') => [
  param(paramName).isUUID().withMessage(`Invalid ${paramName}`),
  handleValidationErrors,
];

// Validate multiple UUID params at once (for routes with multiple params)
export const validateUuidParams = (...paramNames) => [
  ...paramNames.map(name => param(name).isUUID().withMessage(`Invalid ${name}`)),
  handleValidationErrors,
];

// Pagination query validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];
