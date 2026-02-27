import express from 'express';
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  assignStudentToClass,
} from '../controllers/studentController.js';
import { authenticate, authorize, verifySchoolAccess, verifyStudentAccess } from '../middleware/auth.js';
import { validateCreateStudent, validateUpdateStudent, validateUuidParam } from '../middleware/validation.js';

const router = express.Router();

// All student routes require authentication
router.use(authenticate);

// Get all students - school filter applied in controller based on user's schools
router.get('/', verifySchoolAccess, getStudents);

// Get single student - verify access to student's school
router.get('/:id', validateUuidParam('id'), verifyStudentAccess, getStudent);

// Create student
router.post('/', authorize('TEACHER', 'SUPERUSER'), validateCreateStudent, verifySchoolAccess, createStudent);

// Assign student to class
router.patch('/:id/assign-class', validateUuidParam('id'), authorize('TEACHER', 'SUPERUSER'), verifySchoolAccess, assignStudentToClass);

// Update student
router.put('/:id', authorize('TEACHER', 'SUPERUSER'), validateUpdateStudent, verifyStudentAccess, updateStudent);

// Delete student
router.delete('/:id', validateUuidParam('id'), authorize('TEACHER', 'SUPERUSER'), verifyStudentAccess, deleteStudent);

export default router;
