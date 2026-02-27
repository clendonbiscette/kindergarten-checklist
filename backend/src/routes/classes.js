import express from 'express';
import {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
} from '../controllers/classController.js';
import { authenticate, authorize, verifySchoolAccess, verifyClassAccess } from '../middleware/auth.js';
import { validateCreateClass, validateUpdateClass } from '../middleware/validation.js';

const router = express.Router();

// All class routes require authentication
router.use(authenticate);

// Get all classes (filtered by school access)
router.get('/', verifySchoolAccess, getClasses);

// Get single class with students
router.get('/:id', verifyClassAccess, getClass);

// Create class
router.post('/', authorize('TEACHER', 'SUPERUSER'), validateCreateClass, verifySchoolAccess, createClass);

// Update class
router.put('/:id', authorize('TEACHER', 'SUPERUSER'), validateUpdateClass, verifyClassAccess, updateClass);

// Delete class
router.delete('/:id', authorize('TEACHER', 'SUPERUSER'), verifyClassAccess, deleteClass);

// Add student to class
router.post('/:id/students', authorize('TEACHER', 'SUPERUSER'), verifyClassAccess, addStudentToClass);

// Remove student from class
router.delete('/:id/students/:studentId', authorize('TEACHER', 'SUPERUSER'), verifyClassAccess, removeStudentFromClass);

export default router;
