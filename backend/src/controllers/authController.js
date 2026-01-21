import bcrypt from 'bcryptjs';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.js';
import prisma from '../utils/prisma.js';

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
    const validRoles = ['TEACHER', 'SCHOOL_ADMIN', 'COUNTRY_ADMIN', 'PARENT_STUDENT'];
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

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
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

// Register teacher with school assignment
export const registerTeacher = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, schoolId } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, firstName, lastName, schoolId',
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

    // Verify school exists and get country info
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        country: true,
      },
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and assignment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create teacher user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'TEACHER',
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

      // Assign teacher to school
      await tx.userAssignment.create({
        data: {
          userId: user.id,
          schoolId,
        },
      });

      return user;
    });

    // Generate token pair
    const tokens = generateTokenPair(result.id, result.email, result.role);

    res.status(201).json({
      success: true,
      message: 'Teacher registered and assigned to school successfully',
      data: {
        user: {
          ...result,
          schoolId: school.id,
          schoolName: school.name,
          countryId: school.country.id,
          countryName: school.country.name,
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
