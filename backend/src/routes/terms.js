import express from 'express';
import {
  getTerms,
  getTerm,
  createTerm,
  updateTerm,
  deleteTerm,
} from '../controllers/termController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All term routes require authentication
router.use(authenticate);

// Get all terms (all authenticated users can view)
router.get('/', getTerms);

// Get single term
router.get('/:id', getTerm);

// Create term (admins only)
router.post('/', authorize('SCHOOL_ADMIN', 'COUNTRY_ADMIN', 'SUPERUSER'), createTerm);

// Update term (admins only)
router.put('/:id', authorize('SCHOOL_ADMIN', 'COUNTRY_ADMIN', 'SUPERUSER'), updateTerm);

// Delete term (admins only)
router.delete('/:id', authorize('SCHOOL_ADMIN', 'COUNTRY_ADMIN', 'SUPERUSER'), deleteTerm);

export default router;
