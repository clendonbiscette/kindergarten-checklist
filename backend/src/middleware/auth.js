import { verifyToken } from '../utils/jwt.js';
import prisma from '../utils/prisma.js';

// Cache user's school assignments to avoid repeated DB queries
const getSchoolIdsForUser = async (userId) => {
  const assignments = await prisma.userAssignment.findMany({
    where: { userId, schoolId: { not: null } },
    select: { schoolId: true },
  });
  return assignments.map(a => a.schoolId);
};

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token);
      req.user = decoded; // Attach user info to request
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
  }
};

// Role-based access control middleware
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to access this resource.',
      });
    }

    next();
  };
};

// Verify user has access to a specific school
// SUPERUSER and COUNTRY_ADMIN bypass school checks
export const verifySchoolAccess = async (req, res, next) => {
  try {
    const { role, userId } = req.user;

    // Superusers can access any school
    if (role === 'SUPERUSER') {
      return next();
    }

    // Country admins need country-level check (more complex, skip for now)
    if (role === 'COUNTRY_ADMIN') {
      // TODO: Verify country admin has access to school's country
      return next();
    }

    // Get user's school IDs first
    const userSchoolIds = await getSchoolIdsForUser(userId);
    req.userSchoolIds = userSchoolIds;

    // Get schoolId from various sources (params, body, or query)
    // Use optional chaining since req.body may be undefined for GET requests
    const schoolId = req.params.schoolId || req.body?.schoolId || req.query.schoolId;

    if (!schoolId) {
      // No school specified - for SCHOOL_ADMIN, attach their school IDs so controllers can filter
      // This allows listing all resources for their school(s)
      return next();
    }

    // For teachers and school admins, verify they belong to this school
    if (!userSchoolIds.includes(schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this school\'s data.',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message,
    });
  }
};

// Helper to verify ownership of a student
export const verifyStudentAccess = async (req, res, next) => {
  try {
    const { role, userId } = req.user;

    if (role === 'SUPERUSER') {
      return next();
    }

    const studentId = req.params.id || req.params.studentId || req.body?.studentId;

    if (!studentId) {
      return next();
    }

    // Get the student's school
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { schoolId: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    // Verify user has access to student's school
    const userSchoolIds = await getSchoolIdsForUser(userId);

    if (!userSchoolIds.includes(student.schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this student.',
      });
    }

    req.userSchoolIds = userSchoolIds;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message,
    });
  }
};

// Helper to verify ownership of a class
export const verifyClassAccess = async (req, res, next) => {
  try {
    const { role, userId } = req.user;

    if (role === 'SUPERUSER') {
      return next();
    }

    const classId = req.params.id || req.params.classId || req.body?.classId;

    if (!classId) {
      return next();
    }

    // Get the class's school
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { schoolId: true, teacherId: true },
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.',
      });
    }

    // Verify user has access to class's school
    const userSchoolIds = await getSchoolIdsForUser(userId);

    if (!userSchoolIds.includes(classData.schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class.',
      });
    }

    // For teachers, also verify they are assigned to this class
    if (role === 'TEACHER' && classData.teacherId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this class.',
      });
    }

    req.userSchoolIds = userSchoolIds;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message,
    });
  }
};

// Helper to verify ownership of an assessment
export const verifyAssessmentAccess = async (req, res, next) => {
  try {
    const { role, userId } = req.user;

    if (role === 'SUPERUSER') {
      return next();
    }

    const assessmentId = req.params.id || req.params.assessmentId;

    if (!assessmentId) {
      return next();
    }

    // Get the assessment with student's school
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        createdBy: true,
        student: { select: { schoolId: true } },
      },
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found.',
      });
    }

    // Verify user has access to student's school
    const userSchoolIds = await getSchoolIdsForUser(userId);

    if (!userSchoolIds.includes(assessment.student.schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this assessment.',
      });
    }

    // For teachers, verify they created this assessment (for updates)
    if (role === 'TEACHER' && assessment.createdBy !== userId) {
      // Allow teachers to view but not modify other teachers' assessments
      if (req.method !== 'GET') {
        return res.status(403).json({
          success: false,
          message: 'You can only modify assessments you created.',
        });
      }
    }

    req.userSchoolIds = userSchoolIds;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message,
    });
  }
};
