import prisma from '../utils/prisma.js';

// Get all subjects
export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { learningOutcomes: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

// Get all strands
export const getStrands = async (req, res, next) => {
  try {
    const strands = await prisma.strand.findMany({
      orderBy: [{ subject: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { learningOutcomes: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: strands,
    });
  } catch (error) {
    next(error);
  }
};

// Get strands by subject
export const getStrandsBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    const strands = await prisma.strand.findMany({
      where: { subjectId },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { learningOutcomes: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: strands,
    });
  } catch (error) {
    next(error);
  }
};

// Get learning outcomes with optional filtering
export const getLearningOutcomes = async (req, res, next) => {
  try {
    const { subjectId, strandId, search } = req.query;

    const where = {
      ...(subjectId && { subjectId }),
      ...(strandId && { strandId }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const outcomes = await prisma.learningOutcome.findMany({
      where,
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        strand: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: outcomes,
    });
  } catch (error) {
    next(error);
  }
};

// Get single learning outcome
export const getLearningOutcome = async (req, res, next) => {
  try {
    const { id } = req.params;

    const outcome = await prisma.learningOutcome.findUnique({
      where: { id },
      include: {
        subject: true,
        strand: true,
      },
    });

    if (!outcome) {
      return res.status(404).json({
        success: false,
        message: 'Learning outcome not found',
      });
    }

    res.status(200).json({
      success: true,
      data: outcome,
    });
  } catch (error) {
    next(error);
  }
};
