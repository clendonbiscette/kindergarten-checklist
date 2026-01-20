import prisma from '../utils/prisma.js';

// Get all terms for a school
export const getTerms = async (req, res, next) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'schoolId is required',
      });
    }

    const terms = await prisma.academicTerm.findMany({
      where: { schoolId },
      orderBy: [
        { schoolYear: 'desc' },
        { startDate: 'desc' },
      ],
      include: {
        _count: {
          select: {
            assessments: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: terms,
    });
  } catch (error) {
    next(error);
  }
};

// Get single term
export const getTerm = async (req, res, next) => {
  try {
    const { id } = req.params;

    const term = await prisma.academicTerm.findUnique({
      where: { id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            assessments: true,
          },
        },
      },
    });

    if (!term) {
      return res.status(404).json({
        success: false,
        message: 'Term not found',
      });
    }

    res.status(200).json({
      success: true,
      data: term,
    });
  } catch (error) {
    next(error);
  }
};

// Create term
export const createTerm = async (req, res, next) => {
  try {
    const { name, schoolYear, startDate, endDate, schoolId } = req.body;

    if (!name || !schoolYear || !startDate || !endDate || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, schoolYear, startDate, endDate, schoolId',
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    const term = await prisma.academicTerm.create({
      data: {
        name,
        schoolYear,
        startDate: start,
        endDate: end,
        schoolId,
      },
      include: {
        school: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Term created successfully',
      data: term,
    });
  } catch (error) {
    next(error);
  }
};

// Update term
export const updateTerm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, schoolYear, startDate, endDate } = req.body;

    // Validate dates if both provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date',
        });
      }
    }

    const term = await prisma.academicTerm.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(schoolYear && { schoolYear }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
      include: {
        school: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            assessments: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Term updated successfully',
      data: term,
    });
  } catch (error) {
    next(error);
  }
};

// Delete term
export const deleteTerm = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if term has assessments
    const term = await prisma.academicTerm.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assessments: true,
          },
        },
      },
    });

    if (!term) {
      return res.status(404).json({
        success: false,
        message: 'Term not found',
      });
    }

    if (term._count.assessments > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete term with ${term._count.assessments} assessment(s). Please delete or reassign assessments first.`,
      });
    }

    await prisma.academicTerm.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Term deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
