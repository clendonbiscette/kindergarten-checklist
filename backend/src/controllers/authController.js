import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.js';
import prisma from '../utils/prisma.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendSchoolAdminInviteEmail } from '../utils/email.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, firstName, lastName, role',
      });
    }

    // Validate role
    const validRoles = ['TEACHER', 'PARENT_STUDENT'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user — admin-created users are pre-verified
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generate token pair (access + refresh)
    const tokens = generateTokenPair(user.id, user.email, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user with assignments
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        assignments: {
          include: {
            school: {
              include: {
                country: true,
              },
            },
            country: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check email verification (all roles — existing users are migrated to emailVerified=true)
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before logging in. Check your inbox for a verification link.',
      });
    }

    // Generate token pair (access + refresh)
    const tokens = generateTokenPair(user.id, user.email, user.role);

    // Extract school and country info from assignments
    const schoolAssignment = user.assignments?.find(a => a.school);
    const countryAssignment = user.assignments?.find(a => a.country);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          schoolId: schoolAssignment?.school?.id || null,
          schoolName: schoolAssignment?.school?.name || null,
          countryId: schoolAssignment?.school?.country?.id || countryAssignment?.country?.id || null,
          countryName: schoolAssignment?.school?.country?.name || countryAssignment?.country?.name || null,
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh access token using refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Generate new token pair
    const tokens = generateTokenPair(user.id, user.email, user.role);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

// Register teacher with optional school assignment
export const registerTeacher = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, schoolId } = req.body;

    // Validate required fields (schoolId is optional)
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, firstName, lastName',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // If schoolId provided, verify the school exists
    if (schoolId) {
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      if (!school) {
        return res.status(404).json({
          success: false,
          message: 'School not found',
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate email verification token
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user and optional assignment in a transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'TEACHER',
          emailVerified: false,
          emailVerificationToken,
          emailVerificationExpires,
        },
      });

      // Only create school assignment if schoolId was provided
      if (schoolId) {
        await tx.userAssignment.create({
          data: {
            userId: user.id,
            schoolId,
          },
        });
      }

      return user;
    });

    // Send verification email (outside transaction — don't fail registration if email fails)
    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    try {
      await sendVerificationEmail(email, { firstName, verifyUrl });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Registration still succeeded — user can request resend
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account before logging in.',
    });
  } catch (error) {
    next(error);
  }
};

// Verify email address via token
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
      },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This verification link is invalid or has expired.',
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Your email is already verified. You can log in.',
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

// Resend verification email
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Always return 200 to avoid leaking whether an email exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, emailVerified: true },
    });

    if (user && !user.emailVerified) {
      const emailVerificationToken = randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken, emailVerificationExpires },
      });

      const verifyUrl = `${FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
      try {
        await sendVerificationEmail(email, { firstName: user.firstName, verifyUrl });
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "If an unverified account exists for that email, we've sent a new verification link.",
    });
  } catch (error) {
    next(error);
  }
};

// Request password reset
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Always return 200 to avoid leaking whether an email exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, isActive: true },
    });

    if (user && user.isActive) {
      const passwordResetToken = randomBytes(32).toString('hex');
      const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken, passwordResetExpires },
      });

      const resetUrl = `${FRONTEND_URL}/reset-password?token=${passwordResetToken}`;
      try {
        await sendPasswordResetEmail(email, { firstName: user.firstName, resetUrl });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "If an account exists for that email, we've sent a password reset link.",
    });
  } catch (error) {
    next(error);
  }
};

// Reset password via token
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid or has expired.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// Create a School Admin account and assign them to a school
// Protected: COUNTRY_ADMIN, SCHOOL_ADMIN, SUPERUSER
export const createTeacher = async (req, res, next) => {
  try {
    const { firstName, lastName, email, schoolId } = req.body;
    const { role: requesterRole, userId: requesterId } = req.user;

    if (!firstName || !lastName || !email || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, schoolId',
      });
    }

    // Find the school
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Generate a random temp password — admin will set their own via the setup link
    const tempPassword = randomBytes(16).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Generate a 7-day account setup token (re-uses the password reset flow)
    const passwordResetToken = randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newAdmin = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'TEACHER',
          emailVerified: true,
          passwordResetToken,
          passwordResetExpires,
        },
      });
      await tx.userAssignment.create({ data: { userId: user.id, schoolId } });
      return user;
    });

    // Send invite email with setup link
    const setupUrl = `${FRONTEND_URL}/reset-password?token=${passwordResetToken}`;
    try {
      await sendSchoolAdminInviteEmail(email, { firstName, schoolName: school.name, setupUrl });
    } catch (emailError) {
      console.error('Failed to send school admin invite email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: `School admin account created for ${firstName} ${lastName}. A setup link has been sent to ${email}.`,
      data: {
        id: newAdmin.id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        role: newAdmin.role,
        schoolId,
        schoolName: school.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Teacher self-assigns to a school (for teachers who registered without a school)
export const assignSchool = async (req, res, next) => {
  try {
    const { schoolId } = req.body;
    const userId = req.user.userId;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId is required' });
    }

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Create assignment if it doesn't already exist
    const existing = await prisma.userAssignment.findFirst({ where: { userId, schoolId } });
    if (!existing) {
      await prisma.userAssignment.create({ data: { userId, schoolId } });
    }

    // Fetch full user with updated assignments to build fresh token payload
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignments: {
          include: {
            school: { include: { country: true } },
            country: true,
          },
        },
      },
    });

    const tokens = generateTokenPair(user.id, user.email, user.role);
    const schoolAssignment = user.assignments?.find(a => a.school);
    const countryAssignment = user.assignments?.find(a => a.country);

    res.status(200).json({
      success: true,
      message: `You've been assigned to ${school.name}.`,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          schoolId: schoolAssignment?.school?.id || null,
          schoolName: schoolAssignment?.school?.name || null,
          countryId: schoolAssignment?.school?.country?.id || countryAssignment?.country?.id || null,
          countryName: schoolAssignment?.school?.country?.name || countryAssignment?.country?.name || null,
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        assignments: {
          include: {
            school: {
              include: {
                country: true,
              },
            },
            country: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'currentPassword and newPassword are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash: hashed },
    });

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
