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

// Create student (admins only) - verify school access
router.post('/', authorize('SCHOOL_ADMIN', 'COUNTRY_ADMIN', 'SUPERUSER'), validateCreateStudent, verifySchoolAccess, createStudent);

// Assign student to class (teachers can only assign to their own classes)
router.patch('/:id/assign-class', validateUuidParam('id'), authorize('TEACHER', 'SCHOOL_ADMIN', 'COUNTRY_ADMIN', 'SUPERUSER'), verifySchoolAccess, assignStudentToClass);

// Update student (admins only) - verify student access
router.put('/:id', authorize('SCHOOL_ADMIN', 'COUNTRY_ADMIN', 'SUPERUSER'), validateUpdateStudent, verifyStudentAccess, updateStudent);

// Delete student (admins only) - verify student access
router.delete('/:id', validateUuidParam('id'), authorize('SCHOOL_ADMIN', 'COUNTRY_ADMIN', 'SUPERUSER'), verifyStudentAccess, deleteStudent);

export default router;
