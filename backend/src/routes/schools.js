import express from 'express';
import {
  getCountries,
  getSchools,
  getSchool,
  createSchool,
  getSchoolTerms,
  createTerm,
  createMySchool,
  claimSchool,
  updateMySchool,
  getMySchool,
  getCountryAdminOverview,
} from '../controllers/schoolController.js';
import { authenticate, authorize, verifySchoolAccess } from '../middleware/auth.js';

const router = express.Router();

// Public routes (for registration page)
router.get('/countries', getCountries);
router.get('/public', getSchools);

// All routes below require authentication
router.use(authenticate);

// My School (for School Admin onboarding and management)
router.get('/my-school', authorize('SCHOOL_ADMIN'), getMySchool);
router.post('/my-school', authorize('SCHOOL_ADMIN'), createMySchool);
router.post('/claim-school', authorize('SCHOOL_ADMIN'), claimSchool);
router.put('/my-school', authorize('SCHOOL_ADMIN'), updateMySchool);

// Country Admin overview (assigned countries + schools + stats)
router.get('/my-country', authorize('COUNTRY_ADMIN', 'SUPERUSER'), getCountryAdminOverview);

// Schools (verifySchoolAccess populates req.userCountryIds / req.userSchoolIds for filtering)
router.get('/', verifySchoolAccess, getSchools);
router.get('/:id', verifySchoolAccess, getSchool);
router.post('/', authorize('COUNTRY_ADMIN', 'SUPERUSER'), createSchool);

// Academic terms
router.get('/:schoolId/terms', verifySchoolAccess, getSchoolTerms);
router.post('/terms', authorize('SCHOOL_ADMIN', 'COUNTRY_ADMIN'), createTerm);

export default router;
