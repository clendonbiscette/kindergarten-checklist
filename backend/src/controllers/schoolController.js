import prisma from '../utils/prisma.js';

// Returns name, schoolYear, startDate, endDate for the current academic year.
// Academic year starts in September — so Feb 2026 → 2025-26.
function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed; Sep = 8
  const startYear = month >= 8 ? year : year - 1;
  const endYear = startYear + 1;
  return {
    schoolYear: `${startYear}-${String(endYear).slice(2)}`,
    name: `Academic Year ${startYear}-${String(endYear).slice(2)}`,
    startDate: new Date(`${startYear}-09-01`),
    endDate: new Date(`${endYear}-07-31`),
  };
}

// Get all countries
export const getCountries = async (req, res, next) => {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { schools: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: countries,
    });
  } catch (error) {
    next(error);
  }
};

// Get all schools
export const getSchools = async (req, res, next) => {
  try {
    const { countryId } = req.query;

    const where = {};

    if (countryId) {
      where.countryId = countryId;
    } else if (req.userCountryIds) {
      // COUNTRY_ADMIN: restrict to assigned countries (set by verifySchoolAccess)
      where.countryId = { in: req.userCountryIds };
    } else if (req.userSchoolIds) {
      // SCHOOL_ADMIN / TEACHER: restrict to assigned schools
      where.id = { in: req.userSchoolIds };
    }

    const schools = await prisma.school.findMany({
      where,
      include: {
        country: {
          select: {
            name: true,
            code: true,
          },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: schools,
    });
  } catch (error) {
    next(error);
  }
};

// Get single school
export const getSchool = async (req, res, next) => {
  try {
    const { id } = req.params;

    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        country: true,
        _count: {
          select: { students: true, terms: true },
        },
      },
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    res.status(200).json({
      success: true,
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

// Create school
export const createSchool = async (req, res, next) => {
  try {
    const { name, countryId, address, phone, email } = req.body;

    if (!name || !countryId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, countryId',
      });
    }

    // COUNTRY_ADMIN scope check: they can only create schools in their assigned countries
    if (req.user.role === 'COUNTRY_ADMIN') {
      const countryAssignment = await prisma.userAssignment.findFirst({
        where: { userId: req.user.userId, countryId },
      });
      if (!countryAssignment) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this country.',
        });
      }
    }

    const school = await prisma.school.create({
      data: {
        name,
        countryId,
        address,
        phone,
        email,
      },
      include: {
        country: true,
      },
    });

    // Auto-create a default academic term so teachers can record assessments immediately
    const termData = getCurrentAcademicYear();
    await prisma.academicTerm.create({
      data: { ...termData, schoolId: school.id },
    });

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

// Get academic terms for a school
export const getSchoolTerms = async (req, res, next) => {
  try {
    const { schoolId } = req.params;

    const terms = await prisma.academicTerm.findMany({
      where: { schoolId },
      orderBy: [
        { schoolYear: 'desc' },
        { startDate: 'asc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: terms,
    });
  } catch (error) {
    next(error);
  }
};

// Create school for School Admin (onboarding)
export const createMySchool = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, countryId, district, address, phone, email } = req.body;

    if (!name || !countryId || !district) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, countryId, district',
      });
    }

    // Check if admin already has a school assignment
    const existingAssignment = await prisma.userAssignment.findFirst({
      where: {
        userId,
        schoolId: { not: null },
      },
      include: { school: true },
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: `You are already assigned to a school: ${existingAssignment.school.name}`,
      });
    }

    // Create school, assignment, and default term in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the school
      const school = await tx.school.create({
        data: {
          name,
          countryId,
          address: district + (address ? `, ${address}` : ''),
          phone,
          email,
        },
        include: {
          country: true,
        },
      });

      // Assign the admin to the school
      await tx.userAssignment.create({
        data: {
          userId,
          schoolId: school.id,
        },
      });

      // Auto-create default academic term
      const termData = getCurrentAcademicYear();
      await tx.academicTerm.create({
        data: { ...termData, schoolId: school.id },
      });

      return school;
    });

    res.status(201).json({
      success: true,
      message: 'School created and assigned successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Update school (for School Admin)
export const updateMySchool = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, address, phone, email } = req.body;

    // Find the admin's school
    const assignment = await prisma.userAssignment.findFirst({
      where: {
        userId,
        schoolId: { not: null },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'You are not assigned to any school',
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;

    const school = await prisma.school.update({
      where: { id: assignment.schoolId },
      data: updateData,
      include: {
        country: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

// Get current admin's school
export const getMySchool = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const assignment = await prisma.userAssignment.findFirst({
      where: {
        userId,
        schoolId: { not: null },
      },
      include: {
        school: {
          include: {
            country: true,
            _count: {
              select: { students: true, classes: true, terms: true },
            },
          },
        },
      },
    });

    if (!assignment || !assignment.school) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No school assigned',
      });
    }

    // Get teachers at this school
    const teachers = await prisma.userAssignment.findMany({
      where: {
        schoolId: assignment.schoolId,
        user: { role: 'TEACHER', isActive: true },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...assignment.school,
        teachers: teachers.map(t => t.user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Country Admin overview — returns assigned countries, schools, and aggregate stats
export const getCountryAdminOverview = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Get assigned countries
    const countryAssignments = await prisma.userAssignment.findMany({
      where: { userId, countryId: { not: null } },
      select: {
        country: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    const countries = countryAssignments.map(a => a.country).filter(Boolean);
    const countryIds = countries.map(c => c.id);

    if (countryIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          countries: [],
          schools: [],
          stats: { totalSchools: 0, totalStudents: 0, totalTeachers: 0, totalAdmins: 0 },
        },
      });
    }

    // Schools in assigned countries with counts
    const schools = await prisma.school.findMany({
      where: { countryId: { in: countryIds } },
      orderBy: [{ country: { name: 'asc' } }, { name: 'asc' }],
      include: {
        country: { select: { id: true, name: true, code: true } },
        _count: { select: { students: true, classes: true } },
      },
    });

    // User counts per school (bulk — avoids N+1)
    const allAssignments = await prisma.userAssignment.findMany({
      where: { schoolId: { in: schools.map(s => s.id) } },
      select: { schoolId: true, user: { select: { role: true } } },
    });

    const schoolStats = {};
    for (const a of allAssignments) {
      if (!schoolStats[a.schoolId]) schoolStats[a.schoolId] = { teacherCount: 0, adminCount: 0 };
      if (a.user.role === 'TEACHER') schoolStats[a.schoolId].teacherCount++;
      if (a.user.role === 'SCHOOL_ADMIN') schoolStats[a.schoolId].adminCount++;
    }

    const schoolsWithStats = schools.map(school => ({
      ...school,
      teacherCount: schoolStats[school.id]?.teacherCount ?? 0,
      adminCount: schoolStats[school.id]?.adminCount ?? 0,
    }));

    const totalStudents = schools.reduce((sum, s) => sum + s._count.students, 0);
    const totalTeachers = Object.values(schoolStats).reduce((sum, s) => sum + s.teacherCount, 0);
    const totalAdmins = Object.values(schoolStats).reduce((sum, s) => sum + s.adminCount, 0);

    res.status(200).json({
      success: true,
      data: {
        countries,
        schools: schoolsWithStats,
        stats: {
          totalSchools: schools.length,
          totalStudents,
          totalTeachers,
          totalAdmins,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Claim an existing school (for School Admin onboarding with pre-seeded schools)
export const claimSchool = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId is required' });
    }

    // Check if this admin already has a school assignment
    const existingAssignment = await prisma.userAssignment.findFirst({
      where: { userId, schoolId: { not: null } },
      include: { school: true },
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: `You are already assigned to ${existingAssignment.school.name}. Please log out and back in if this seems wrong.`,
      });
    }

    // Find the target school
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { country: true },
    });

    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Check if school already has other SCHOOL_ADMIN users (for notice, not a blocker)
    const existingAdminCount = await prisma.userAssignment.count({
      where: { schoolId, user: { role: 'SCHOOL_ADMIN' } },
    });

    // Create the UserAssignment
    await prisma.userAssignment.create({
      data: { userId, schoolId },
    });

    // Auto-create default term if school doesn't have one yet
    const termCount = await prisma.academicTerm.count({ where: { schoolId } });
    if (termCount === 0) {
      const termData = getCurrentAcademicYear();
      await prisma.academicTerm.create({ data: { ...termData, schoolId } });
    }

    res.status(200).json({
      success: true,
      message: existingAdminCount > 0
        ? `You've been added as a co-administrator for ${school.name}.`
        : `You are now the administrator for ${school.name}.`,
      data: school,
      hasCoAdmin: existingAdminCount > 0,
    });
  } catch (error) {
    next(error);
  }
};

// Create academic term
export const createTerm = async (req, res, next) => {
  try {
    const { name, schoolYear, startDate, endDate, schoolId } = req.body;

    if (!name || !schoolYear || !startDate || !endDate || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, schoolYear, startDate, endDate, schoolId',
      });
    }

    const term = await prisma.academicTerm.create({
      data: {
        name,
        schoolYear,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        schoolId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Academic term created successfully',
      data: term,
    });
  } catch (error) {
    next(error);
  }
};
