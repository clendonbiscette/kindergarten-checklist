import prisma from '../utils/prisma.js';

// Create a new assessment
export const createAssessment = async (req, res, next) => {
  try {
    const {
      studentId,
      learningOutcomeId,
      termId,
      assessmentDate,
      rating,
      comment,
    } = req.body;

    // Validate required fields
    if (!studentId || !learningOutcomeId || !termId || !assessmentDate || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, learningOutcomeId, termId, assessmentDate, rating',
      });
    }

    // Validate rating
    const validRatings = ['EASILY_MEETING', 'MEETING', 'NEEDS_PRACTICE'];
    if (!validRatings.includes(rating)) {
      return res.status(400).json({
        success: false,
        message: `Invalid rating. Must be one of: ${validRatings.join(', ')}`,
      });
    }

    const teacherId = req.user.userId;

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        studentId,
        learningOutcomeId,
        teacherId,
        termId,
        assessmentDate: new Date(assessmentDate),
        rating,
        comment: comment || null,
        createdBy: teacherId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        learningOutcome: {
          select: {
            id: true,
            code: true,
            description: true,
            strand: {
              select: {
                name: true,
              },
            },
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};

// Get all assessments for a student
export const getStudentAssessments = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { subjectId, strandId, termId } = req.query;

    const where = {
      studentId,
      ...(subjectId && {
        learningOutcome: {
          subjectId,
        },
      }),
      ...(strandId && {
        learningOutcome: {
          strandId,
        },
      }),
      ...(termId && { termId }),
    };

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        learningOutcome: {
          include: {
            subject: true,
            strand: true,
          },
        },
        term: {
          select: {
            name: true,
            schoolYear: true,
          },
        },
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        assessmentDate: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    next(error);
  }
};

// Get assessment history for a specific learning outcome and student
export const getOutcomeHistory = async (req, res, next) => {
  try {
    const { studentId, outcomeId } = req.params;

    const assessments = await prisma.assessment.findMany({
      where: {
        studentId,
        learningOutcomeId: outcomeId,
      },
      include: {
        term: {
          select: {
            name: true,
            schoolYear: true,
          },
        },
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        assessmentDate: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    next(error);
  }
};

// Update an assessment
export const updateAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment, assessmentDate } = req.body;

    // Validate rating if provided
    if (rating) {
      const validRatings = ['EASILY_MEETING', 'MEETING', 'NEEDS_PRACTICE'];
      if (!validRatings.includes(rating)) {
        return res.status(400).json({
          success: false,
          message: `Invalid rating. Must be one of: ${validRatings.join(', ')}`,
        });
      }
    }

    const userId = req.user.userId;

    const assessment = await prisma.assessment.update({
      where: { id },
      data: {
        ...(rating && { rating }),
        ...(comment !== undefined && { comment }),
        ...(assessmentDate && { assessmentDate: new Date(assessmentDate) }),
        updatedBy: userId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        learningOutcome: {
          select: {
            id: true,
            code: true,
            description: true,
            strand: {
              select: {
                name: true,
              },
            },
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};

// Delete an assessment
export const deleteAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.assessment.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get assessments by term (for class overview/strand reports)
export const getTermAssessments = async (req, res, next) => {
  try {
    const { termId } = req.params;
    const { subjectId, strandId } = req.query;

    const where = {
      termId,
      ...(subjectId && {
        learningOutcome: {
          subjectId,
        },
      }),
      ...(strandId && {
        learningOutcome: {
          strandId,
        },
      }),
    };

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        learningOutcome: {
          include: {
            subject: true,
            strand: true,
          },
        },
      },
      orderBy: [
        { student: { lastName: 'asc' } },
        { learningOutcome: { displayOrder: 'asc' } },
      ],
    });

    res.status(200).json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    next(error);
  }
};
