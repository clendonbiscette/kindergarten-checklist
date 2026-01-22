import prisma from '../utils/prisma.js';
// import { createAuditLog, softDeleteWithAudit } from '../utils/audit.js'; // Uncomment after migration

// Get all students (with optional school filtering)
export const getStudents = async (req, res, next) => {
  try {
    const { schoolId, classId, isActive } = req.query;
    const userSchoolIds = req.userSchoolIds; // Set by verifySchoolAccess middleware

    // Build school filter
    let schoolFilter = {};
    if (schoolId) {
      schoolFilter = { schoolId };
    } else if (userSchoolIds && userSchoolIds.length > 0) {
      // Filter to only schools the user has access to
      schoolFilter = { schoolId: { in: userSchoolIds } };
    }

    const where = {
      ...schoolFilter,
      ...(classId !== undefined && { classId: classId === 'null' ? null : classId }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      // NOTE: Soft delete filter will be added after running migration:
      // ...(includeDeleted !== 'true' && { deletedAt: null }),
    };

    const students = await prisma.student.findMany({
      where,
      include: {
        school: {
          select: {
            name: true,
            country: {
              select: {
                name: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// Get single student
export const getStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        school: {
          include: {
            country: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        studentParents: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// Create student
export const createStudent = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      studentIdNumber,
      schoolId,
      classId,
    } = req.body;

    if (!firstName || !lastName || !studentIdNumber || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, studentIdNumber, schoolId',
      });
    }

    // If classId provided, verify it exists and belongs to the same school
    if (classId) {
      const classData = await prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Class not found',
        });
      }

      if (classData.schoolId !== schoolId) {
        return res.status(400).json({
          success: false,
          message: 'Class must belong to the same school as the student',
        });
      }
    }

    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        studentIdNumber,
        schoolId,
        ...(classId && { classId }),
      },
      include: {
        school: {
          select: {
            name: true,
          },
        },
        class: {
          select: {
            name: true,
            gradeLevel: true,
          },
        },
      },
    });

    // Audit log - uncomment after migration
    // await createAuditLog({
    //   tableName: 'Student',
    //   recordId: student.id,
    //   action: 'CREATE',
    //   newValues: student,
    //   userId: req.user.userId,
    //   req,
    // });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// Update student
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, dateOfBirth, studentIdNumber, classId, isActive } = req.body;

    // If classId is being updated, verify it exists and belongs to same school
    if (classId !== undefined) {
      if (classId !== null) {
        const student = await prisma.student.findUnique({
          where: { id },
        });

        if (!student) {
          return res.status(404).json({
            success: false,
            message: 'Student not found',
          });
        }

        const classData = await prisma.class.findUnique({
          where: { id: classId },
        });

        if (!classData) {
          return res.status(404).json({
            success: false,
            message: 'Class not found',
          });
        }

        if (classData.schoolId !== student.schoolId) {
          return res.status(400).json({
            success: false,
            message: 'Class must belong to the same school as the student',
          });
        }
      }
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(studentIdNumber && { studentIdNumber }),
        ...(classId !== undefined && { classId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        school: {
          select: {
            name: true,
          },
        },
        class: {
          select: {
            name: true,
            gradeLevel: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// Delete student
export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.student.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Assign student to a class (for teachers - limited to their own classes)
export const assignStudentToClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { classId } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Get the student with current class info
    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        schoolId: true,
        firstName: true,
        lastName: true,
        classId: true,
        class: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // If classId is provided, verify the class exists and teacher is assigned to it
    if (classId) {
      const classData = await prisma.class.findUnique({
        where: { id: classId },
        select: { id: true, schoolId: true, teacherId: true, name: true },
      });

      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Class not found',
        });
      }

      // Class must be in the same school as the student
      if (classData.schoolId !== student.schoolId) {
        return res.status(400).json({
          success: false,
          message: 'Class must belong to the same school as the student',
        });
      }

      // For teachers, they can only assign to their own classes
      if (userRole === 'TEACHER' && classData.teacherId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only assign students to your own classes',
        });
      }
    } else if (userRole === 'TEACHER') {
      // Teachers can only remove students from their own classes
      if (!student.classId || student.class?.teacherId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only remove students from your own classes',
        });
      }
    }

    // Update the student's class
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { classId: classId || null },
      include: {
        school: { select: { name: true } },
        class: { select: { name: true, gradeLevel: true } },
      },
    });

    res.status(200).json({
      success: true,
      message: classId
        ? `Student assigned to class successfully`
        : 'Student removed from class',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};
