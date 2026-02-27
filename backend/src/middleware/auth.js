import { verifyToken } from '../utils/jwt.js';
import prisma from '../utils/prisma.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

// Returns all schoolIds a user is directly assigned to
const getSchoolIdsForUser = async (userId) => {
  const assignments = await prisma.userAssignment.findMany({
    where: { userId, schoolId: { not: null } },
    select: { schoolId: true },
  });
  return assignments.map(a => a.schoolId);
};

// ─── authenticate ────────────────────────────────────────────────────────────

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

// ─── authorize ───────────────────────────────────────────────────────────────

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

// ─── verifySchoolAccess ──────────────────────────────────────────────────────
// SUPERUSER: unrestricted.
// TEACHER: can only access schools they are directly assigned to.

export const verifySchoolAccess = async (req, res, next) => {
  try {
    const { role, userId } = req.user;

    if (role === 'SUPERUSER') {
      return next();
    }

    const schoolId = req.params.id || req.params.schoolId || req.body?.schoolId || req.query.schoolId;

    // TEACHER: direct school assignment check
    const userSchoolIds = await getSchoolIdsForUser(userId);
    req.userSchoolIds = userSchoolIds;

    if (!schoolId) {
      // No school specified — attach school IDs so controllers can filter
      return next();
    }

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

// ─── verifyStudentAccess ─────────────────────────────────────────────────────

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

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        schoolId: true,
        classId: true,
        class: { select: { teacherId: true } },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    // TEACHER: direct school assignment check
    const userSchoolIds = await getSchoolIdsForUser(userId);
    req.userSchoolIds = userSchoolIds;

    if (!userSchoolIds.includes(student.schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this student.',
      });
    }

    // Teachers can manage any student at their school.
    // Assessment-level access (verifyAssessmentAccess) handles the
    // finer-grained "teacher can only record assessments for their own class" rule.

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message,
    });
  }
};

// ─── verifyClassAccess ───────────────────────────────────────────────────────

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

    // TEACHER: direct school assignment check
    const userSchoolIds = await getSchoolIdsForUser(userId);
    req.userSchoolIds = userSchoolIds;

    if (!userSchoolIds.includes(classData.schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class.',
      });
    }

    // Teachers can only access their own classes
    if (role === 'TEACHER' && classData.teacherId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this class.',
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

// ─── verifyAssessmentAccess ──────────────────────────────────────────────────

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

    // TEACHER: direct school assignment check
    const userSchoolIds = await getSchoolIdsForUser(userId);
    req.userSchoolIds = userSchoolIds;

    if (!userSchoolIds.includes(assessment.student.schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this assessment.',
      });
    }

    // For teachers, verify they created this assessment (for non-GET requests)
    if (role === 'TEACHER' && assessment.createdBy !== userId) {
      if (req.method !== 'GET') {
        return res.status(403).json({
          success: false,
          message: 'You can only modify assessments you created.',
        });
      }
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
