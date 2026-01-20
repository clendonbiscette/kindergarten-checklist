import express from 'express';
import {
  getSubjects,
  getStrands,
  getStrandsBySubject,
  getLearningOutcomes,
  getLearningOutcome,
} from '../controllers/curriculumController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All curriculum routes require authentication
router.use(authenticate);

// Get all subjects
router.get('/subjects', getSubjects);

// Get all strands
router.get('/strands', getStrands);

// Get strands by subject
router.get('/subjects/:subjectId/strands', getStrandsBySubject);

// Get learning outcomes (with optional filtering)
router.get('/outcomes', getLearningOutcomes);

// Get single learning outcome
router.get('/outcomes/:id', getLearningOutcome);

export default router;
