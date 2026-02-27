import express from 'express';
import {
  getCountries,
  getSchools,
  getSchool,
  createSchool,
  getSchoolTerms,
} from '../controllers/schoolController.js';
import { authenticate, authorize, verifySchoolAccess } from '../middleware/auth.js';

const router = express.Router();

// Public routes (for registration page)
router.get('/countries', getCountries);
router.get('/public', getSchools);

// All routes below require authentication
router.use(authenticate);

// Schools (verifySchoolAccess populates req.userSchoolIds for filtering)
router.get('/', verifySchoolAccess, getSchools);
router.get('/:id', verifySchoolAccess, getSchool);
router.post('/', authorize('TEACHER', 'SUPERUSER'), createSchool);

// Academic terms
router.get('/:schoolId/terms', verifySchoolAccess, getSchoolTerms);

export default router;
