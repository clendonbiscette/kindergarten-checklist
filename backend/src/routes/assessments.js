import express from 'express';
import {
  createAssessment,
  getStudentAssessments,
  getOutcomeHistory,
  updateAssessment,
  deleteAssessment,
  getTermAssessments,
} from '../controllers/assessmentController.js';
import { authenticate, authorize, verifyStudentAccess, verifyAssessmentAccess } from '../middleware/auth.js';
import { validateCreateAssessment, validateUpdateAssessment, validateUuidParam } from '../middleware/validation.js';

const router = express.Router();

// All assessment routes require authentication
router.use(authenticate);

// Create assessment (teachers and admins) - student access verified
router.post('/', authorize('TEACHER', 'SCHOOL_ADMIN', 'COUNTRY_ADMIN'), validateCreateAssessment, verifyStudentAccess, createAssessment);

// Get assessments for a student - verify student belongs to user's school
router.get('/student/:studentId', validateUuidParam('studentId'), verifyStudentAccess, getStudentAssessments);

// Get assessment history for a specific outcome and student
router.get('/student/:studentId/outcome/:outcomeId', validateUuidParam('studentId'), validateUuidParam('outcomeId'), verifyStudentAccess, getOutcomeHistory);

// Get assessments by term (for class reports)
router.get('/term/:termId', validateUuidParam('termId'), getTermAssessments);

// Update assessment (teachers and admins) - verify assessment ownership
router.put('/:id', authorize('TEACHER', 'SCHOOL_ADMIN', 'COUNTRY_ADMIN'), validateUpdateAssessment, verifyAssessmentAccess, updateAssessment);

// Delete assessment (teachers and admins) - verify assessment ownership
router.delete('/:id', validateUuidParam('id'), authorize('TEACHER', 'SCHOOL_ADMIN', 'COUNTRY_ADMIN'), verifyAssessmentAccess, deleteAssessment);

export default router;
