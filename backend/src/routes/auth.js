import express from 'express';
import { register, login, getProfile, registerTeacher, refreshToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRegister, validateLogin, validateRefreshToken } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/register/teacher', registerTeacher);
router.post('/login', validateLogin, login);
router.post('/refresh', validateRefreshToken, refreshToken);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;
