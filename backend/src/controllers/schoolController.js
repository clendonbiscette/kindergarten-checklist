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
    } else if (req.userSchoolIds) {
      // TEACHER: restrict to assigned schools
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

// Create school (SUPERUSER or TEACHER adding their school if not listed)
export const createSchool = async (req, res, next) => {
  try {
    const { name, countryId, address, phone, email } = req.body;

    if (!name || !countryId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, countryId',
      });
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

    // If a TEACHER created the school, auto-assign them to it
    if (req.user.role === 'TEACHER') {
      await prisma.userAssignment.create({
        data: { userId: req.user.userId, schoolId: school.id },
      });
    }

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
