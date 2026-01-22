import prisma from '../utils/prisma.js';
import { generateCSV, generatePDF } from '../services/exportService.js';

// Helper to calculate rating distribution
const calculateRatingDistribution = (assessments) => {
  const distribution = {
    EASILY_MEETING: 0,
    MEETING: 0,
    NEEDS_PRACTICE: 0,
    total: assessments.length,
  };

  assessments.forEach((a) => {
    if (distribution[a.rating] !== undefined) {
      distribution[a.rating]++;
    }
  });

  return distribution;
};

// Helper to calculate performance score (3=EASILY_MEETING, 2=MEETING, 1=NEEDS_PRACTICE)
const calculatePerformanceScore = (assessments) => {
  if (assessments.length === 0) return 0;

  const scoreMap = {
    EASILY_MEETING: 3,
    MEETING: 2,
    NEEDS_PRACTICE: 1,
  };

  const total = assessments.reduce((sum, a) => sum + (scoreMap[a.rating] || 0), 0);
  return Math.round((total / (assessments.length * 3)) * 100);
};

// Get student report (By Learner) - One student's performance across all subjects
export const getStudentReport = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { termId } = req.query;

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: { select: { name: true } },
        class: { select: { name: true, gradeLevel: true } },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Build where clause for assessments
    const where = { studentId };
    if (termId) {
      where.termId = termId;
    }

    // Get all assessments for the student
    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        learningOutcome: {
          include: {
            subject: { select: { id: true, name: true, displayOrder: true } },
            strand: { select: { id: true, name: true, displayOrder: true } },
          },
        },
        term: { select: { name: true, schoolYear: true } },
      },
      orderBy: { assessmentDate: 'desc' },
    });

    // Get all learning outcomes for completion calculation
    const allOutcomes = await prisma.learningOutcome.findMany({
      include: {
        subject: { select: { id: true, name: true } },
        strand: { select: { id: true, name: true } },
      },
    });

    // Group assessments by subject
    const bySubject = {};
    assessments.forEach((assessment) => {
      const subjectName = assessment.learningOutcome.subject.name;
      if (!bySubject[subjectName]) {
        bySubject[subjectName] = {
          subjectId: assessment.learningOutcome.subject.id,
          subjectName,
          displayOrder: assessment.learningOutcome.subject.displayOrder,
          assessments: [],
          strands: {},
        };
      }
      bySubject[subjectName].assessments.push(assessment);

      // Also group by strand within subject
      const strandName = assessment.learningOutcome.strand.name;
      if (!bySubject[subjectName].strands[strandName]) {
        bySubject[subjectName].strands[strandName] = {
          strandId: assessment.learningOutcome.strand.id,
          strandName,
          displayOrder: assessment.learningOutcome.strand.displayOrder,
          assessments: [],
        };
      }
      bySubject[subjectName].strands[strandName].assessments.push(assessment);
    });

    // Calculate stats per subject
    const subjects = Object.values(bySubject)
      .map((subject) => {
        const subjectOutcomes = allOutcomes.filter(
          (o) => o.subject.id === subject.subjectId
        );
        const assessedOutcomeIds = new Set(
          subject.assessments.map((a) => a.learningOutcomeId)
        );

        return {
          ...subject,
          strands: Object.values(subject.strands)
            .map((strand) => ({
              ...strand,
              ratingDistribution: calculateRatingDistribution(strand.assessments),
              performanceScore: calculatePerformanceScore(strand.assessments),
            }))
            .sort((a, b) => a.displayOrder - b.displayOrder),
          ratingDistribution: calculateRatingDistribution(subject.assessments),
          performanceScore: calculatePerformanceScore(subject.assessments),
          totalOutcomes: subjectOutcomes.length,
          assessedOutcomes: assessedOutcomeIds.size,
          completionRate: subjectOutcomes.length
            ? Math.round((assessedOutcomeIds.size / subjectOutcomes.length) * 100)
            : 0,
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // Overall stats
    const assessedOutcomeIds = new Set(assessments.map((a) => a.learningOutcomeId));
    const overallStats = {
      totalAssessments: assessments.length,
      totalOutcomes: allOutcomes.length,
      assessedOutcomes: assessedOutcomeIds.size,
      completionRate: allOutcomes.length
        ? Math.round((assessedOutcomeIds.size / allOutcomes.length) * 100)
        : 0,
      ratingDistribution: calculateRatingDistribution(assessments),
      performanceScore: calculatePerformanceScore(assessments),
    };

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          school: student.school?.name,
          class: student.class?.name,
          gradeLevel: student.class?.gradeLevel,
        },
        termId,
        overallStats,
        subjects,
        assessments, // Raw assessments for detailed view
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get strand report (By Strand) - All students' performance for a specific strand
export const getStrandReport = async (req, res, next) => {
  try {
    const { strandId } = req.params;
    const { classId, termId } = req.query;

    // Get strand info
    const strand = await prisma.strand.findUnique({
      where: { id: strandId },
      include: {
        subject: { select: { name: true } },
        learningOutcomes: {
          orderBy: { displayOrder: 'asc' },
          select: { id: true, code: true, description: true, displayOrder: true },
        },
      },
    });

    if (!strand) {
      return res.status(404).json({
        success: false,
        message: 'Strand not found',
      });
    }

    // Get students - either from class or all in school
    let students;
    if (classId) {
      students = await prisma.student.findMany({
        where: { classId, isActive: true },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: { id: true, firstName: true, lastName: true },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'classId is required for strand reports',
      });
    }

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: { name: true, gradeLevel: true, academicYear: true },
    });

    // Build where clause for assessments
    const where = {
      learningOutcome: { strandId },
      studentId: { in: students.map((s) => s.id) },
    };
    if (termId) {
      where.termId = termId;
    }

    // Get assessments
    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        learningOutcome: {
          select: { id: true, code: true, description: true, displayOrder: true },
        },
        student: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { assessmentDate: 'desc' },
    });

    // Create student-outcome matrix
    const studentMatrix = students.map((student) => {
      const studentAssessments = assessments.filter(
        (a) => a.studentId === student.id
      );

      // Get latest assessment per outcome
      const outcomeRatings = {};
      strand.learningOutcomes.forEach((outcome) => {
        const outcomeAssessments = studentAssessments
          .filter((a) => a.learningOutcomeId === outcome.id)
          .sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));

        outcomeRatings[outcome.id] = outcomeAssessments[0]?.rating || null;
      });

      return {
        student,
        outcomeRatings,
        ratingDistribution: calculateRatingDistribution(studentAssessments),
        performanceScore: calculatePerformanceScore(studentAssessments),
        assessedCount: Object.values(outcomeRatings).filter((r) => r !== null).length,
        totalOutcomes: strand.learningOutcomes.length,
      };
    });

    // Calculate overall strand stats
    const overallStats = {
      totalStudents: students.length,
      totalOutcomes: strand.learningOutcomes.length,
      totalAssessments: assessments.length,
      ratingDistribution: calculateRatingDistribution(assessments),
      performanceScore: calculatePerformanceScore(assessments),
      averageCompletion:
        studentMatrix.length > 0
          ? Math.round(
              studentMatrix.reduce(
                (sum, s) => sum + (s.assessedCount / s.totalOutcomes) * 100,
                0
              ) / studentMatrix.length
            )
          : 0,
    };

    // Calculate per-outcome stats (which SCOs students struggle with)
    const outcomeStats = strand.learningOutcomes.map((outcome) => {
      const outcomeAssessments = assessments.filter(
        (a) => a.learningOutcomeId === outcome.id
      );
      return {
        outcome,
        ratingDistribution: calculateRatingDistribution(outcomeAssessments),
        performanceScore: calculatePerformanceScore(outcomeAssessments),
        assessedStudents: new Set(outcomeAssessments.map((a) => a.studentId)).size,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        strand: {
          id: strand.id,
          name: strand.name,
          subjectName: strand.subject.name,
        },
        class: classInfo,
        termId,
        outcomes: strand.learningOutcomes,
        studentMatrix,
        outcomeStats,
        overallStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get outcome report (By SCO) - How each student performed for a specific learning outcome
export const getOutcomeReport = async (req, res, next) => {
  try {
    const { outcomeId } = req.params;
    const { classId, termId } = req.query;

    // Get learning outcome info
    const outcome = await prisma.learningOutcome.findUnique({
      where: { id: outcomeId },
      include: {
        subject: { select: { name: true } },
        strand: { select: { name: true } },
      },
    });

    if (!outcome) {
      return res.status(404).json({
        success: false,
        message: 'Learning outcome not found',
      });
    }

    // Get students from class
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'classId is required for outcome reports',
      });
    }

    const students = await prisma.student.findMany({
      where: { classId, isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true },
    });

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: { name: true, gradeLevel: true, academicYear: true },
    });

    // Build where clause
    const where = {
      learningOutcomeId: outcomeId,
      studentId: { in: students.map((s) => s.id) },
    };
    if (termId) {
      where.termId = termId;
    }

    // Get assessments
    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        term: { select: { name: true, schoolYear: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
      orderBy: { assessmentDate: 'desc' },
    });

    // Create student results
    const studentResults = students.map((student) => {
      const studentAssessments = assessments
        .filter((a) => a.studentId === student.id)
        .sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));

      return {
        student,
        latestRating: studentAssessments[0]?.rating || null,
        latestDate: studentAssessments[0]?.assessmentDate || null,
        latestComment: studentAssessments[0]?.comment || null,
        assessmentCount: studentAssessments.length,
        history: studentAssessments.map((a) => ({
          rating: a.rating,
          date: a.assessmentDate,
          comment: a.comment,
          term: a.term,
          assessedBy: a.creator
            ? `${a.creator.firstName} ${a.creator.lastName}`
            : null,
        })),
      };
    });

    // Overall stats
    const latestAssessments = studentResults
      .filter((s) => s.latestRating)
      .map((s) => ({ rating: s.latestRating }));

    const overallStats = {
      totalStudents: students.length,
      assessedStudents: studentResults.filter((s) => s.latestRating).length,
      notAssessed: studentResults.filter((s) => !s.latestRating).length,
      ratingDistribution: calculateRatingDistribution(latestAssessments),
      performanceScore: calculatePerformanceScore(latestAssessments),
    };

    res.status(200).json({
      success: true,
      data: {
        outcome: {
          id: outcome.id,
          code: outcome.code,
          description: outcome.description,
          subjectName: outcome.subject.name,
          strandName: outcome.strand.name,
        },
        class: classInfo,
        termId,
        studentResults,
        overallStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get class summary
export const getClassSummary = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { termId } = req.query;

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        school: { select: { name: true } },
        _count: { select: { students: true } },
      },
    });

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    // Get students in class
    const students = await prisma.student.findMany({
      where: { classId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });

    // Build where clause
    const where = {
      studentId: { in: students.map((s) => s.id) },
    };
    if (termId) {
      where.termId = termId;
    }

    // Get assessments
    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        learningOutcome: {
          include: {
            subject: { select: { id: true, name: true } },
            strand: { select: { id: true, name: true } },
          },
        },
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Get all outcomes for completion calculation
    const allOutcomes = await prisma.learningOutcome.findMany();

    // Per-student stats
    const studentStats = students.map((student) => {
      const studentAssessments = assessments.filter(
        (a) => a.studentId === student.id
      );
      const assessedOutcomeIds = new Set(
        studentAssessments.map((a) => a.learningOutcomeId)
      );

      return {
        student,
        totalAssessments: studentAssessments.length,
        assessedOutcomes: assessedOutcomeIds.size,
        completionRate: allOutcomes.length
          ? Math.round((assessedOutcomeIds.size / allOutcomes.length) * 100)
          : 0,
        ratingDistribution: calculateRatingDistribution(studentAssessments),
        performanceScore: calculatePerformanceScore(studentAssessments),
      };
    });

    // Per-subject stats
    const subjectStats = {};
    assessments.forEach((a) => {
      const subjectName = a.learningOutcome.subject.name;
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = [];
      }
      subjectStats[subjectName].push(a);
    });

    const subjectSummary = Object.entries(subjectStats).map(
      ([subjectName, subjectAssessments]) => ({
        subjectName,
        totalAssessments: subjectAssessments.length,
        ratingDistribution: calculateRatingDistribution(subjectAssessments),
        performanceScore: calculatePerformanceScore(subjectAssessments),
      })
    );

    // Students needing attention (high NEEDS_PRACTICE)
    const studentsNeedingAttention = studentStats
      .filter((s) => {
        const needsPracticePercent =
          s.totalAssessments > 0
            ? (s.ratingDistribution.NEEDS_PRACTICE / s.totalAssessments) * 100
            : 0;
        return needsPracticePercent >= 50;
      })
      .sort(
        (a, b) =>
          b.ratingDistribution.NEEDS_PRACTICE - a.ratingDistribution.NEEDS_PRACTICE
      );

    // Overall stats
    const assessedOutcomeIds = new Set(assessments.map((a) => a.learningOutcomeId));
    const overallStats = {
      studentCount: students.length,
      totalAssessments: assessments.length,
      totalOutcomes: allOutcomes.length,
      assessedOutcomes: assessedOutcomeIds.size,
      completionRate: allOutcomes.length
        ? Math.round((assessedOutcomeIds.size / allOutcomes.length) * 100)
        : 0,
      ratingDistribution: calculateRatingDistribution(assessments),
      performanceScore: calculatePerformanceScore(assessments),
    };

    res.status(200).json({
      success: true,
      data: {
        class: {
          id: classInfo.id,
          name: classInfo.name,
          gradeLevel: classInfo.gradeLevel,
          academicYear: classInfo.academicYear,
          teacher: classInfo.teacher
            ? `${classInfo.teacher.firstName} ${classInfo.teacher.lastName}`
            : null,
          school: classInfo.school?.name,
        },
        termId,
        overallStats,
        studentStats,
        subjectSummary,
        studentsNeedingAttention,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get school summary (for School Admins)
export const getSchoolSummary = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { termId } = req.query;

    // Get school info
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        country: { select: { name: true } },
        _count: {
          select: { students: true, classes: true, terms: true },
        },
      },
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Get all classes
    const classes = await prisma.class.findMany({
      where: { schoolId },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
    });

    // Get all students
    const students = await prisma.student.findMany({
      where: { schoolId, isActive: true },
      select: { id: true, classId: true },
    });

    // Build where clause
    const where = {
      studentId: { in: students.map((s) => s.id) },
    };
    if (termId) {
      where.termId = termId;
    }

    // Get all assessments
    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        learningOutcome: {
          include: {
            subject: { select: { id: true, name: true } },
          },
        },
        student: { select: { classId: true } },
      },
    });

    // Get all outcomes
    const allOutcomes = await prisma.learningOutcome.findMany();

    // Per-class stats
    const classStats = classes.map((cls) => {
      const classStudentIds = students
        .filter((s) => s.classId === cls.id)
        .map((s) => s.id);
      const classAssessments = assessments.filter((a) =>
        classStudentIds.includes(a.studentId)
      );
      const assessedOutcomeIds = new Set(
        classAssessments.map((a) => a.learningOutcomeId)
      );

      return {
        classId: cls.id,
        className: cls.name,
        gradeLevel: cls.gradeLevel,
        teacher: cls.teacher
          ? `${cls.teacher.firstName} ${cls.teacher.lastName}`
          : 'Unassigned',
        studentCount: cls._count.students,
        totalAssessments: classAssessments.length,
        assessedOutcomes: assessedOutcomeIds.size,
        completionRate: allOutcomes.length
          ? Math.round((assessedOutcomeIds.size / allOutcomes.length) * 100)
          : 0,
        ratingDistribution: calculateRatingDistribution(classAssessments),
        performanceScore: calculatePerformanceScore(classAssessments),
      };
    });

    // Per-subject stats
    const subjectStats = {};
    assessments.forEach((a) => {
      const subjectName = a.learningOutcome.subject.name;
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = [];
      }
      subjectStats[subjectName].push(a);
    });

    const subjectSummary = Object.entries(subjectStats).map(
      ([subjectName, subjectAssessments]) => ({
        subjectName,
        totalAssessments: subjectAssessments.length,
        ratingDistribution: calculateRatingDistribution(subjectAssessments),
        performanceScore: calculatePerformanceScore(subjectAssessments),
      })
    );

    // Classes needing attention (lowest performance)
    const classesNeedingAttention = classStats
      .filter((c) => c.performanceScore < 60 && c.totalAssessments > 0)
      .sort((a, b) => a.performanceScore - b.performanceScore)
      .slice(0, 5);

    // Overall stats
    const assessedOutcomeIds = new Set(assessments.map((a) => a.learningOutcomeId));
    const overallStats = {
      classCount: classes.length,
      studentCount: students.length,
      totalAssessments: assessments.length,
      totalOutcomes: allOutcomes.length,
      assessedOutcomes: assessedOutcomeIds.size,
      completionRate: allOutcomes.length
        ? Math.round((assessedOutcomeIds.size / allOutcomes.length) * 100)
        : 0,
      ratingDistribution: calculateRatingDistribution(assessments),
      performanceScore: calculatePerformanceScore(assessments),
    };

    res.status(200).json({
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
          country: school.country?.name,
        },
        termId,
        overallStats,
        classStats,
        subjectSummary,
        classesNeedingAttention,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get detailed student-subject report (matching template format)
// Shows all assessments for a student in a specific subject, organized by strand with date columns
export const getStudentSubjectReport = async (req, res, next) => {
  try {
    const { studentId, subjectId } = req.params;
    const { termId } = req.query;

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: { select: { name: true } },
        class: { select: { name: true, gradeLevel: true } },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get subject info
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        strands: {
          orderBy: { displayOrder: 'asc' },
          include: {
            learningOutcomes: {
              orderBy: { displayOrder: 'asc' },
              select: {
                id: true,
                code: true,
                description: true,
                displayOrder: true,
              },
            },
          },
        },
      },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Build where clause for assessments
    const where = {
      studentId,
      learningOutcome: { subjectId },
    };
    if (termId) {
      where.termId = termId;
    }

    // Get all assessments for this student in this subject
    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        learningOutcome: {
          select: { id: true, code: true },
        },
        term: { select: { name: true, schoolYear: true } },
      },
      orderBy: { assessmentDate: 'asc' },
    });

    // Get term info if specified
    let termInfo = null;
    if (termId) {
      termInfo = await prisma.academicTerm.findUnique({
        where: { id: termId },
        select: { name: true, schoolYear: true, startDate: true, endDate: true },
      });
    }

    // Get unique assessment dates for column headers
    const uniqueDates = [...new Set(
      assessments.map(a => a.assessmentDate.toISOString().split('T')[0])
    )].sort();

    // Organize data by strand and outcome
    const strandData = subject.strands.map((strand) => {
      const outcomes = strand.learningOutcomes.map((outcome) => {
        // Get all assessments for this outcome
        const outcomeAssessments = assessments.filter(
          (a) => a.learningOutcomeId === outcome.id
        );

        // Create date-keyed map of assessments
        const assessmentsByDate = {};
        outcomeAssessments.forEach((a) => {
          const dateKey = a.assessmentDate.toISOString().split('T')[0];
          assessmentsByDate[dateKey] = {
            rating: a.rating,
            comment: a.comment || '',
          };
        });

        return {
          id: outcome.id,
          code: outcome.code,
          description: outcome.description,
          assessmentsByDate,
        };
      });

      return {
        id: strand.id,
        name: strand.name,
        outcomes,
      };
    });

    // Calculate summary statistics
    const ratingDistribution = calculateRatingDistribution(assessments);
    const performanceScore = calculatePerformanceScore(assessments);
    const totalOutcomes = subject.strands.reduce(
      (sum, strand) => sum + strand.learningOutcomes.length,
      0
    );
    const assessedOutcomeIds = new Set(assessments.map((a) => a.learningOutcomeId));

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          studentIdNumber: student.studentIdNumber,
          school: student.school?.name,
          class: student.class?.name,
          gradeLevel: student.class?.gradeLevel,
        },
        subject: {
          id: subject.id,
          name: subject.name,
        },
        term: termInfo,
        assessmentDates: uniqueDates,
        strands: strandData,
        summary: {
          totalOutcomes,
          assessedOutcomes: assessedOutcomeIds.size,
          completionRate: totalOutcomes
            ? Math.round((assessedOutcomeIds.size / totalOutcomes) * 100)
            : 0,
          ratingDistribution,
          performanceScore,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export report to CSV or PDF
export const exportReport = async (req, res, next) => {
  try {
    const { reportType, format: exportFormat, reportData, options } = req.body;

    // Debug logging
    console.log('Export request received:', {
      reportType,
      exportFormat,
      hasReportData: !!reportData,
      reportDataKeys: reportData ? Object.keys(reportData) : [],
    });

    if (!reportType || !exportFormat || !reportData) {
      return res.status(400).json({
        success: false,
        message: 'reportType, format, and reportData are required',
        debug: { reportType, exportFormat, hasReportData: !!reportData },
      });
    }

    if (!['csv', 'pdf'].includes(exportFormat)) {
      return res.status(400).json({
        success: false,
        message: 'format must be "csv" or "pdf"',
      });
    }

    if (!['student', 'student-subject', 'strand', 'outcome', 'class', 'school'].includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reportType',
      });
    }

    let fileBuffer;
    let contentType;
    let filename;

    if (exportFormat === 'csv') {
      fileBuffer = await generateCSV(reportData, reportType);
      contentType = 'text/csv';
      filename = `${reportType}-report-${Date.now()}.csv`;
    } else {
      fileBuffer = await generatePDF(reportData, reportType, options || {});
      contentType = 'application/pdf';
      filename = `${reportType}-report-${Date.now()}.pdf`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
};
