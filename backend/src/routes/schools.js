import express from 'express';
import {
  getCountries,
  getSchools,
  getSchool,
  createSchool,
  getSchoolTerms,
  createTerm,
  createMySchool,
  updateMySchool,
  getMySchool,
} from '../controllers/schoolController.js';
import { authenticate, authorize, verifySchoolAccess } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Countries
router.get('/countries', getCountries);

// My School (for School Admin onboarding and management)
router.get('/my-school', authorize('SCHOOL_ADMIN'), getMySchool);
router.post('/my-school', authorize('SCHOOL_ADMIN'), createMySchool);
router.put('/my-school', authorize('SCHOOL_ADMIN'), updateMySchool);

// Schools
router.get('/', getSchools);
router.get('/:id', verifySchoolAccess, getSchool);
router.post('/', authorize('COUNTRY_ADMIN', 'SUPERUSER'), createSchool);

// Academic terms
router.get('/:schoolId/terms', verifySchoolAccess, getSchoolTerms);
router.post('/terms', authorize('SCHOOL_ADMIN', 'COUNTRY_ADMIN'), createTerm);

export default router;
