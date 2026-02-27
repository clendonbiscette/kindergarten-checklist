import prisma from '../utils/prisma.js';

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

    // TEACHER: class-level isolation.
    // When no explicit classId filter is provided, restrict to students in
    // the teacher's own classes plus unassigned students (staging area).
    // This mirrors the frontend accessibleStudents filter but enforces it at
    // the API boundary so raw API calls can't bypass it.
    if (req.user?.role === 'TEACHER' && classId === undefined) {
      const teacherClasses = await prisma.class.findMany({
        where: { teacherId: req.user.userId, schoolId: { in: userSchoolIds } },
        select: { id: true },
      });
      const teacherClassIds = teacherClasses.map(c => c.id);
      where.OR = [
        { classId: { in: teacherClassIds } },
        { classId: null },
      ];
    }

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
    let {
      firstName,
      lastName,
      dateOfBirth,
      studentIdNumber,
      schoolId,
      classId,
    } = req.body;

    // Teachers auto-get their school — they don't need to pass schoolId manually
    if (req.user.role === 'TEACHER' && !schoolId) {
      const assignment = await prisma.userAssignment.findFirst({
        where: { userId: req.user.userId, schoolId: { not: null } },
        select: { schoolId: true },
      });
      schoolId = assignment?.schoolId || null;
    }

    if (!firstName || !lastName || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, schoolId',
      });
    }

    // Use teacher-provided ID if given, otherwise auto-generate
    if (!studentIdNumber || !studentIdNumber.trim()) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      studentIdNumber = `STU-${timestamp}-${random}`;
    } else {
      studentIdNumber = studentIdNumber.trim();
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

    let student;
    try {
      student = await prisma.student.create({
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
    } catch (dbError) {
      if (dbError.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: `A student with ID "${studentIdNumber}" already exists at this school. Please use a different ID number.`,
        });
      }
      throw dbError;
    }

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

    // Block deletion if the student has any assessment records
    const assessmentCount = await prisma.assessment.count({ where: { studentId: id } });
    if (assessmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete student with ${assessmentCount} assessment record${assessmentCount !== 1 ? 's' : ''}. Deactivate the student instead to preserve historical data.`,
      });
    }

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
