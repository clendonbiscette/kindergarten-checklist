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

const router = express.Router();

// All class routes require authentication
router.use(authenticate);

// Get all classes (filtered by school access)
router.get('/', verifySchoolAccess, getClasses);

// Get single class with students
router.get('/:id', verifyClassAccess, getClass);

// Create class (teachers and admins, must have school access)
router.post('/', authorize('TEACHER', 'SCHOOL_ADMIN', 'COUNTRY_ADMIN'), verifySchoolAccess, createClass);

// Update class (teachers and admins, must have class access)
router.put('/:id', authorize('TEACHER', 'SCHOOL_ADMIN', 'COUNTRY_ADMIN'), verifyClassAccess, updateClass);

// Delete class (admins only, must have class access)
router.delete('/:id', authorize('SCHOOL_ADMIN', 'COUNTRY_ADMIN'), verifyClassAccess, deleteClass);

// Add student to class (teachers and admins, must have class access)
router.post('/:id/students', authorize('TEACHER', 'SCHOOL_ADMIN', 'COUNTRY_ADMIN'), verifyClassAccess, addStudentToClass);

// Remove student from class (teachers and admins, must have class access)
router.delete('/:id/students/:studentId', authorize('TEACHER', 'SCHOOL_ADMIN', 'COUNTRY_ADMIN'), verifyClassAccess, removeStudentFromClass);

export default router;
