import express from 'express';
import {
  register, login, getProfile, registerTeacher, refreshToken,
  verifyEmail, resendVerification, forgotPassword, resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateRegister, validateLogin, validateRefreshToken, validateTeacherRegister,
  validateVerifyEmail, validateForgotPassword, validateResetPassword,
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/register/teacher', validateTeacherRegister, registerTeacher);
router.post('/login', validateLogin, login);
router.post('/refresh', validateRefreshToken, refreshToken);

// Email verification
router.get('/verify-email', validateVerifyEmail, verifyEmail);
router.post('/resend-verification', validateForgotPassword, resendVerification);

// Password reset
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;
