import prisma from '../utils/prisma.js';

// Get all classes (with optional filtering)
export const getClasses = async (req, res, next) => {
  try {
    const { schoolId, teacherId, isActive } = req.query;
    const userSchoolIds = req.userSchoolIds; // Set by verifySchoolAccess middleware

    // Build where clause
    let schoolFilter = {};
    if (schoolId) {
      schoolFilter = { schoolId };
    } else if (userSchoolIds && userSchoolIds.length > 0) {
      // Filter to only schools the user has access to
      schoolFilter = { schoolId: { in: userSchoolIds } };
    }

    const where = {
      ...schoolFilter,
      ...(teacherId && { teacherId }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const classes = await prisma.class.findMany({
      where,
      include: {
        school: {
          select: {
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: [
        { academicYear: 'desc' },
        { gradeLevel: 'asc' },
        { name: 'asc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

// Get single class with students
export const getClass = async (req, res, next) => {
  try {
    const { id } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id },
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
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        students: {
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' },
          ],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            studentIdNumber: true,
            isActive: true,
          },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    next(error);
  }
};

// Create class
export const createClass = async (req, res, next) => {
  try {
    const {
      name,
      gradeLevel,
      schoolId,
      teacherId,
      academicYear,
    } = req.body;

    // Validate required fields
    if (!name || !gradeLevel || !schoolId || !teacherId || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, gradeLevel, schoolId, teacherId, academicYear',
      });
    }

    // Verify the teacher exists and is a teacher
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    if (teacher.role !== 'TEACHER' && teacher.role !== 'SCHOOL_ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'User must have TEACHER or SCHOOL_ADMIN role',
      });
    }

    // Ensure the teacher has a UserAssignment for this school
    // This is required so the teacher can access students and other school data
    const existingAssignment = await prisma.userAssignment.findFirst({
      where: {
        userId: teacherId,
        schoolId: schoolId,
      },
    });

    if (!existingAssignment) {
      await prisma.userAssignment.create({
        data: {
          userId: teacherId,
          schoolId: schoolId,
        },
      });
    }

    // Create the class
    const newClass = await prisma.class.create({
      data: {
        name,
        gradeLevel,
        schoolId,
        teacherId,
        academicYear,
      },
      include: {
        school: {
          select: {
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass,
    });
  } catch (error) {
    next(error);
  }
};

// Update class
export const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, gradeLevel, teacherId, academicYear, isActive } = req.body;

    // If updating teacher, verify they exist and have correct role
    if (teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found',
        });
      }

      if (teacher.role !== 'TEACHER' && teacher.role !== 'SCHOOL_ADMIN') {
        return res.status(400).json({
          success: false,
          message: 'User must have TEACHER or SCHOOL_ADMIN role',
        });
      }

      // Get the class to find its schoolId
      const classData = await prisma.class.findUnique({
        where: { id },
        select: { schoolId: true },
      });

      if (classData) {
        // Ensure the teacher has a UserAssignment for this school
        const existingAssignment = await prisma.userAssignment.findFirst({
          where: {
            userId: teacherId,
            schoolId: classData.schoolId,
          },
        });

        if (!existingAssignment) {
          await prisma.userAssignment.create({
            data: {
              userId: teacherId,
              schoolId: classData.schoolId,
            },
          });
        }
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(gradeLevel && { gradeLevel }),
        ...(teacherId && { teacherId }),
        ...(academicYear && { academicYear }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        school: {
          select: {
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass,
    });
  } catch (error) {
    next(error);
  }
};

// Delete class
export const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if class has students
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    if (classData._count.students > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class with ${classData._count.students} student(s). Please reassign or remove students first.`,
      });
    }

    await prisma.class.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Add student to class
export const addStudentToClass = async (req, res, next) => {
  try {
    const { id } = req.params; // class id
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required',
      });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Verify class exists
    const classData = await prisma.class.findUnique({
      where: { id },
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    // Verify student belongs to same school
    if (student.schoolId !== classData.schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Student must belong to the same school as the class',
      });
    }

    // Update student to assign to class
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { classId: id },
      include: {
        class: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Student added to class successfully',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

// Remove student from class
export const removeStudentFromClass = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;

    // Verify student exists and is in this class
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (student.classId !== id) {
      return res.status(400).json({
        success: false,
        message: 'Student is not in this class',
      });
    }

    // Remove student from class
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { classId: null },
    });

    res.status(200).json({
      success: true,
      message: 'Student removed from class successfully',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};
