// Analytics Calculation Utilities
// Provides functions to calculate statistics and insights from assessment data

/**
 * Calculate assessment completion rate
 * @param {Array} assessments - All assessments
 * @param {Array} outcomes - All learning outcomes
 * @param {Array} students - All students
 * @returns {Object} - Completion statistics
 */
export const calculateCompletionRate = (assessments, outcomes, students) => {
  if (!students?.length || !outcomes?.length) {
    return {
      total: 0,
      completed: 0,
      percentage: 0
    };
  }

  const totalPossible = students.length * outcomes.length;
  const completed = assessments?.length || 0;
  const percentage = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

  return {
    total: totalPossible,
    completed,
    percentage
  };
};

/**
 * Calculate rating distribution
 * @param {Array} assessments - All assessments
 * @returns {Object} - Count of each rating type
 */
export const calculateRatingDistribution = (assessments) => {
  const distribution = {
    EASILY_MEETING: 0,
    MEETING: 0,
    NEEDS_PRACTICE: 0
  };

  if (!assessments?.length) return distribution;

  assessments.forEach(assessment => {
    if (distribution.hasOwnProperty(assessment.rating)) {
      distribution[assessment.rating]++;
    }
  });

  return distribution;
};

/**
 * Calculate progress by subject
 * @param {Array} assessments - All assessments
 * @param {Array} outcomes - All learning outcomes with subject info
 * @param {Array} students - All students
 * @returns {Array} - Progress per subject
 */
export const calculateProgressBySubject = (assessments, outcomes, students) => {
  if (!outcomes?.length || !students?.length) return [];

  // Group outcomes by subject
  const outcomesBySubject = outcomes.reduce((acc, outcome) => {
    const subjectName = outcome.subject?.name || 'Unknown';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(outcome.id);
    return {};
  }, {});

  // Calculate progress for each subject
  return Object.entries(outcomesBySubject).map(([subjectName, outcomeIds]) => {
    const totalPossible = students.length * outcomeIds.length;
    const completed = assessments?.filter(a => outcomeIds.includes(a.learningOutcomeId))?.length || 0;
    const percentage = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

    return {
      subject: subjectName,
      total: totalPossible,
      completed,
      percentage
    };
  });
};

/**
 * Calculate student performance summary
 * @param {Array} assessments - Student's assessments
 * @returns {Object} - Performance metrics
 */
export const calculateStudentPerformance = (assessments) => {
  if (!assessments?.length) {
    return {
      total: 0,
      easilyMeeting: 0,
      meeting: 0,
      needsPractice: 0,
      averageScore: 0
    };
  }

  const distribution = calculateRatingDistribution(assessments);

  // Calculate average score (EASILY_MEETING=3, MEETING=2, NEEDS_PRACTICE=1)
  const scoreMap = {
    EASILY_MEETING: 3,
    MEETING: 2,
    NEEDS_PRACTICE: 1
  };

  const totalScore = assessments.reduce((sum, assessment) => {
    return sum + (scoreMap[assessment.rating] || 0);
  }, 0);

  const averageScore = totalScore / assessments.length;

  return {
    total: assessments.length,
    easilyMeeting: distribution.EASILY_MEETING,
    meeting: distribution.MEETING,
    needsPractice: distribution.NEEDS_PRACTICE,
    averageScore: averageScore.toFixed(2)
  };
};

/**
 * Identify students needing attention
 * @param {Array} students - All students
 * @param {Array} assessments - All assessments
 * @param {number} threshold - Percentage threshold for "needs attention"
 * @returns {Array} - Students needing attention
 */
export const identifyStudentsNeedingAttention = (students, assessments, threshold = 50) => {
  if (!students?.length) return [];

  return students.map(student => {
    const studentAssessments = assessments?.filter(a => a.studentId === student.id) || [];
    const performance = calculateStudentPerformance(studentAssessments);

    const needsPracticePercentage = performance.total > 0
      ? Math.round((performance.needsPractice / performance.total) * 100)
      : 0;

    return {
      ...student,
      assessmentCount: performance.total,
      needsPracticePercentage,
      needsAttention: needsPracticePercentage >= threshold
    };
  }).filter(student => student.needsAttention)
    .sort((a, b) => b.needsPracticePercentage - a.needsPracticePercentage);
};

/**
 * Calculate outcome coverage (which outcomes have been assessed)
 * @param {Array} assessments - All assessments
 * @param {Array} outcomes - All learning outcomes
 * @returns {Object} - Coverage statistics
 */
export const calculateOutcomeCoverage = (assessments, outcomes) => {
  if (!outcomes?.length) {
    return {
      total: 0,
      covered: 0,
      percentage: 0,
      uncoveredOutcomes: []
    };
  }

  const assessedOutcomeIds = new Set(
    assessments?.map(a => a.learningOutcomeId) || []
  );

  const covered = assessedOutcomeIds.size;
  const percentage = Math.round((covered / outcomes.length) * 100);

  const uncoveredOutcomes = outcomes
    .filter(outcome => !assessedOutcomeIds.has(outcome.id))
    .map(outcome => ({
      id: outcome.id,
      code: outcome.code,
      description: outcome.description,
      subject: outcome.subject?.name || 'Unknown'
    }));

  return {
    total: outcomes.length,
    covered,
    percentage,
    uncoveredOutcomes
  };
};

/**
 * Calculate trend data for charts
 * @param {Array} assessments - All assessments with dates
 * @param {string} groupBy - 'day', 'week', 'month'
 * @returns {Array} - Trend data points
 */
export const calculateTrendData = (assessments, groupBy = 'week') => {
  if (!assessments?.length) return [];

  // Sort assessments by date
  const sortedAssessments = [...assessments].sort((a, b) =>
    new Date(a.assessmentDate) - new Date(b.assessmentDate)
  );

  // Group by time period
  const grouped = {};

  sortedAssessments.forEach(assessment => {
    const date = new Date(assessment.assessmentDate);
    let key;

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        EASILY_MEETING: 0,
        MEETING: 0,
        NEEDS_PRACTICE: 0,
        total: 0
      };
    }

    grouped[key][assessment.rating]++;
    grouped[key].total++;
  });

  return Object.values(grouped).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );
};

/**
 * Calculate class-wide statistics
 * @param {Array} assessments - All class assessments
 * @param {Array} students - All students in class
 * @param {Array} outcomes - All learning outcomes
 * @returns {Object} - Class statistics
 */
export const calculateClassStatistics = (assessments, students, outcomes) => {
  const completionRate = calculateCompletionRate(assessments, outcomes, students);
  const ratingDistribution = calculateRatingDistribution(assessments);
  const coverage = calculateOutcomeCoverage(assessments, outcomes);
  const studentsNeedingAttention = identifyStudentsNeedingAttention(students, assessments);

  // Calculate average performance
  const totalAssessments = assessments?.length || 0;
  const performancePercentage = totalAssessments > 0
    ? Math.round(
        ((ratingDistribution.EASILY_MEETING * 3 + ratingDistribution.MEETING * 2 + ratingDistribution.NEEDS_PRACTICE * 1)
        / (totalAssessments * 3)) * 100
      )
    : 0;

  return {
    studentCount: students?.length || 0,
    outcomeCount: outcomes?.length || 0,
    assessmentCount: totalAssessments,
    completionRate,
    ratingDistribution,
    coverage,
    studentsNeedingAttention,
    performancePercentage
  };
};
