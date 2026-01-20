import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';

// Get all users with filtering and pagination
export const getUsers = async (req, res, next) => {
  try {
    const {
      role,
      countryId,
      schoolId,
      isActive,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by country or school through assignments
    if (countryId || schoolId) {
      where.assignments = {
        some: {
          ...(countryId && { countryId }),
          ...(schoolId && { schoolId }),
        },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: [
          { role: 'asc' },
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
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
                select: {
                  id: true,
                  name: true,
                  country: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              country: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single user by ID
export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
        classes: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            academicYear: true,
            _count: {
              select: { students: true },
            },
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

// Create a new user (School Admin or other)
export const createUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, firstName, lastName, role',
      });
    }

    // Validate role (SUPERUSER cannot be created through this endpoint)
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

    res.status(201).json({
      success: true,
      message: `${role.replace('_', ' ')} created successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update user (change role, status, or info)
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, isActive } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent modifying SUPERUSER role
    if (existingUser.role === 'SUPERUSER' && role && role !== 'SUPERUSER') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change the role of a superuser',
      });
    }

    // Validate role if being changed
    if (role) {
      const validRoles = ['TEACHER', 'SCHOOL_ADMIN', 'COUNTRY_ADMIN', 'PARENT_STUDENT'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        });
      }
    }

    // Build update data
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Reset user password
export const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent resetting SUPERUSER password through this endpoint
    if (existingUser.role === 'SUPERUSER') {
      return res.status(403).json({
        success: false,
        message: 'Cannot reset superuser password through this endpoint',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Deactivate user
export const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deactivating SUPERUSER
    if (existingUser.role === 'SUPERUSER') {
      return res.status(403).json({
        success: false,
        message: 'Cannot deactivate a superuser',
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Assign user to school
export const assignUserToSchool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'School ID is required',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { country: true },
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.userAssignment.findFirst({
      where: {
        userId: id,
        schoolId,
      },
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'User is already assigned to this school',
      });
    }

    // Create assignment
    const assignment = await prisma.userAssignment.create({
      data: {
        userId: id,
        schoolId,
      },
      include: {
        school: {
          include: { country: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `User assigned to ${school.name} successfully`,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

// Remove user from school
export const removeUserFromSchool = async (req, res, next) => {
  try {
    const { id, schoolId } = req.params;

    const assignment = await prisma.userAssignment.findFirst({
      where: {
        userId: id,
        schoolId,
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'User is not assigned to this school',
      });
    }

    await prisma.userAssignment.delete({
      where: { id: assignment.id },
    });

    res.status(200).json({
      success: true,
      message: 'User removed from school successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get all schools with stats
export const getSchools = async (req, res, next) => {
  try {
    const { countryId, search } = req.query;

    const where = {};

    if (countryId) {
      where.countryId = countryId;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const schools = await prisma.school.findMany({
      where,
      orderBy: [
        { country: { name: 'asc' } },
        { name: 'asc' },
      ],
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            students: true,
            classes: true,
            assignments: true,
          },
        },
      },
    });

    // Get admin counts per school
    const schoolsWithAdmins = await Promise.all(
      schools.map(async (school) => {
        const adminCount = await prisma.userAssignment.count({
          where: {
            schoolId: school.id,
            user: { role: 'SCHOOL_ADMIN' },
          },
        });
        const teacherCount = await prisma.userAssignment.count({
          where: {
            schoolId: school.id,
            user: { role: 'TEACHER' },
          },
        });
        return {
          ...school,
          adminCount,
          teacherCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: schoolsWithAdmins,
    });
  } catch (error) {
    next(error);
  }
};

// Sync teacher-school assignments based on class assignments
// This ensures all teachers assigned to classes have corresponding UserAssignment records
export const syncTeacherSchoolAssignments = async (req, res, next) => {
  try {
    // Find all classes with teachers
    const classesWithTeachers = await prisma.class.findMany({
      where: {
        teacherId: { not: null },
      },
      select: {
        id: true,
        name: true,
        teacherId: true,
        schoolId: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        school: {
          select: {
            name: true,
          },
        },
      },
    });

    const syncResults = [];
    let createdCount = 0;
    let existingCount = 0;

    // Check each teacher-school combination
    for (const classData of classesWithTeachers) {
      const existingAssignment = await prisma.userAssignment.findFirst({
        where: {
          userId: classData.teacherId,
          schoolId: classData.schoolId,
        },
      });

      if (!existingAssignment) {
        // Create the missing assignment
        await prisma.userAssignment.create({
          data: {
            userId: classData.teacherId,
            schoolId: classData.schoolId,
          },
        });
        createdCount++;
        syncResults.push({
          status: 'created',
          teacher: `${classData.teacher.firstName} ${classData.teacher.lastName}`,
          school: classData.school.name,
          class: classData.name,
        });
      } else {
        existingCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Sync complete. Created ${createdCount} new assignment(s). ${existingCount} already existed.`,
      data: {
        created: createdCount,
        existing: existingCount,
        details: syncResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get system statistics
export const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTeachers,
      totalSchoolAdmins,
      totalSchools,
      totalStudents,
      totalAssessments,
      usersByRole,
      schoolsByCountry,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
      prisma.user.count({ where: { role: 'SCHOOL_ADMIN', isActive: true } }),
      prisma.school.count(),
      prisma.student.count({ where: { isActive: true } }),
      prisma.assessment.count(),
      prisma.user.groupBy({
        by: ['role'],
        where: { isActive: true },
        _count: true,
      }),
      prisma.school.groupBy({
        by: ['countryId'],
        _count: true,
      }),
    ]);

    // Get country names for the groupBy result
    const countries = await prisma.country.findMany({
      select: { id: true, name: true },
    });
    const countryMap = Object.fromEntries(countries.map(c => [c.id, c.name]));

    const schoolsByCountryNamed = schoolsByCountry.map(item => ({
      country: countryMap[item.countryId] || 'Unknown',
      count: item._count,
    }));

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalTeachers,
          totalSchoolAdmins,
          totalSchools,
          totalStudents,
          totalAssessments,
        },
        usersByRole: usersByRole.map(item => ({
          role: item.role,
          count: item._count,
        })),
        schoolsByCountry: schoolsByCountryNamed,
      },
    });
  } catch (error) {
    next(error);
  }
};
