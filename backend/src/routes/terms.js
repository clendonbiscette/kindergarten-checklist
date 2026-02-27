import express from 'express';
import {
  getTerms,
  getTerm,
  createTerm,
  updateTerm,
  deleteTerm,
  bulkCreateTerms,
} from '../controllers/termController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All term routes require authentication
router.use(authenticate);

// Get all terms (all authenticated users can view)
router.get('/', getTerms);

// Get single term
router.get('/:id', getTerm);

// Create term (teachers create terms for their school; SUPERUSER can create for any school)
router.post('/', authorize('TEACHER', 'SUPERUSER'), createTerm);

// Update term
router.put('/:id', authorize('TEACHER', 'SUPERUSER'), updateTerm);

// Delete term
router.delete('/:id', authorize('TEACHER', 'SUPERUSER'), deleteTerm);

// Bulk-create the same term across multiple schools (Superuser only)
router.post('/bulk', authorize('SUPERUSER'), bulkCreateTerms);

export default router;
