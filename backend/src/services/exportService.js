import PDFDocument from 'pdfkit';
import { format } from 'fast-csv';

// Rating display helpers
const RATING_SYMBOLS = {
  EASILY_MEETING: '+',
  MEETING: '=',
  NEEDS_PRACTICE: 'x',
};

const RATING_LABELS = {
  EASILY_MEETING: 'Easily Meeting',
  MEETING: 'Meeting',
  NEEDS_PRACTICE: 'Needs Practice',
};

/**
 * Generate CSV from report data
 * @param {Object} reportData - The report data to export
 * @param {string} reportType - Type of report (student, student-subject, strand, outcome, class, school)
 * @returns {Promise<Buffer>} CSV file as buffer
 */
export const generateCSV = async (reportData, reportType) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const csvStream = format({ headers: true });

    csvStream.on('data', (chunk) => chunks.push(chunk));
    csvStream.on('end', () => resolve(Buffer.concat(chunks)));
    csvStream.on('error', reject);

    const rows = formatDataForCSV(reportData, reportType);
    rows.forEach((row) => csvStream.write(row));
    csvStream.end();
  });
};

/**
 * Format report data for CSV based on report type
 */
const formatDataForCSV = (data, reportType) => {
  switch (reportType) {
    case 'student':
      return formatStudentReportCSV(data);
    case 'student-subject':
      return formatStudentSubjectReportCSV(data);
    case 'strand':
      return formatStrandReportCSV(data);
    case 'outcome':
      return formatOutcomeReportCSV(data);
    case 'class':
      return formatClassSummaryCSV(data);
    case 'school':
      return formatSchoolSummaryCSV(data);
    default:
      return [];
  }
};

// Format student report (By Learner) - matches getStudentReport API response
const formatStudentReportCSV = (data) => {
  const rows = [];

  // Add student info as header row
  rows.push({
    Subject: `Student: ${data.student.firstName} ${data.student.lastName}`,
    Strand: `Class: ${data.student.class || 'N/A'}`,
    'Performance Score': `Overall: ${data.overallStats?.performanceScore || 0}%`,
    'Completion Rate': `${data.overallStats?.completionRate || 0}%`,
    'Total Assessments': data.overallStats?.totalAssessments || 0,
  });

  // Add empty separator row
  rows.push({
    Subject: '',
    Strand: '',
    'Performance Score': '',
    'Completion Rate': '',
    'Total Assessments': '',
  });

  // Add subject breakdown
  if (data.subjects && Array.isArray(data.subjects)) {
    data.subjects.forEach((subject) => {
      rows.push({
        Subject: subject.subjectName,
        Strand: '',
        'Performance Score': `${subject.performanceScore}%`,
        'Completion Rate': `${subject.completionRate}%`,
        'Total Assessments': subject.assessments?.length || 0,
      });

      // Add strand breakdown within subject
      if (subject.strands && Array.isArray(subject.strands)) {
        subject.strands.forEach((strand) => {
          rows.push({
            Subject: '',
            Strand: `  ${strand.strandName}`,
            'Performance Score': `${strand.performanceScore}%`,
            'Completion Rate': '',
            'Total Assessments': strand.assessments?.length || 0,
          });
        });
      }
    });
  }

  return rows;
};

// Format student-subject report (Detailed Report) - matches getStudentSubjectReport API response
const formatStudentSubjectReportCSV = (data) => {
  const rows = [];

  // Header info
  rows.push({
    Strand: `Student: ${data.student.firstName} ${data.student.lastName}`,
    'Outcome Code': `Subject: ${data.subject?.name || 'N/A'}`,
    Description: `Class: ${data.student.class || 'N/A'}`,
    Rating: '',
    Date: '',
  });

  rows.push({
    Strand: '',
    'Outcome Code': '',
    Description: '',
    Rating: '',
    Date: '',
  });

  // Add strands and outcomes
  if (data.strands && Array.isArray(data.strands)) {
    data.strands.forEach((strand) => {
      // Strand header
      rows.push({
        Strand: strand.name,
        'Outcome Code': '',
        Description: '',
        Rating: '',
        Date: '',
      });

      // Outcomes within strand
      if (strand.outcomes && Array.isArray(strand.outcomes)) {
        strand.outcomes.forEach((outcome) => {
          // Get the most recent assessment date and rating
          const dates = Object.keys(outcome.assessmentsByDate || {}).sort().reverse();
          const latestDate = dates[0] || '';
          const latestAssessment = outcome.assessmentsByDate?.[latestDate];

          rows.push({
            Strand: '',
            'Outcome Code': outcome.code,
            Description: outcome.description,
            Rating: latestAssessment?.rating ? RATING_LABELS[latestAssessment.rating] : 'Not Assessed',
            Date: latestDate,
          });
        });
      }
    });
  }

  return rows;
};

// Format strand report (By Strand) - matches getStrandReport API response
const formatStrandReportCSV = (data) => {
  const rows = [];

  // Header with strand info
  const outcomeHeaders = data.outcomes?.reduce((acc, o) => ({ ...acc, [o.code]: '' }), {}) || {};
  rows.push({
    Student: `Strand: ${data.strand?.name || 'N/A'} (${data.strand?.subjectName || ''})`,
    ...outcomeHeaders,
    'Performance Score': '',
  });

  // Student rows from studentMatrix
  if (data.studentMatrix && Array.isArray(data.studentMatrix)) {
    data.studentMatrix.forEach((item) => {
      const row = {
        Student: `${item.student.firstName} ${item.student.lastName}`,
      };

      // Add rating for each outcome
      if (data.outcomes && Array.isArray(data.outcomes)) {
        data.outcomes.forEach((outcome) => {
          const rating = item.outcomeRatings?.[outcome.id];
          row[outcome.code] = rating ? RATING_SYMBOLS[rating] : '-';
        });
      }

      row['Performance Score'] = `${item.performanceScore}%`;
      rows.push(row);
    });
  }

  return rows;
};

// Format outcome report (By SCO) - matches getOutcomeReport API response
const formatOutcomeReportCSV = (data) => {
  const rows = [];

  // Add outcome info
  rows.push({
    Student: `Outcome: ${data.outcome?.code || 'N/A'} - ${data.outcome?.description || ''}`,
    Rating: '',
    Date: '',
    Comment: '',
  });

  rows.push({
    Student: '',
    Rating: '',
    Date: '',
    Comment: '',
  });

  // Student results
  if (data.studentResults && Array.isArray(data.studentResults)) {
    data.studentResults.forEach((result) => {
      rows.push({
        Student: `${result.student.firstName} ${result.student.lastName}`,
        Rating: result.latestRating ? RATING_LABELS[result.latestRating] : 'Not Assessed',
        Date: result.latestDate ? new Date(result.latestDate).toLocaleDateString() : '',
        Comment: result.latestComment || '',
      });
    });
  }

  return rows;
};

// Format class summary - matches getClassSummary API response
const formatClassSummaryCSV = (data) => {
  const rows = [];

  // Summary info
  rows.push({
    Metric: 'Class Summary',
    Value: data.class?.name || 'N/A',
  });
  rows.push({
    Metric: 'Total Students',
    Value: data.overallStats?.studentCount || 0,
  });
  rows.push({
    Metric: 'Total Assessments',
    Value: data.overallStats?.totalAssessments || 0,
  });
  rows.push({
    Metric: 'Performance Score',
    Value: `${data.overallStats?.performanceScore || 0}%`,
  });

  // Rating distribution
  rows.push({ Metric: '', Value: '' });
  rows.push({ Metric: 'Rating Distribution', Value: '' });
  rows.push({
    Metric: 'Easily Meeting (+)',
    Value: data.overallStats?.ratingDistribution?.EASILY_MEETING || 0,
  });
  rows.push({
    Metric: 'Meeting (=)',
    Value: data.overallStats?.ratingDistribution?.MEETING || 0,
  });
  rows.push({
    Metric: 'Needs Practice (x)',
    Value: data.overallStats?.ratingDistribution?.NEEDS_PRACTICE || 0,
  });

  return rows;
};

// Format school summary - matches getSchoolSummary API response
const formatSchoolSummaryCSV = (data) => {
  const rows = [];

  // School summary
  rows.push({
    Class: 'School Summary',
    Students: data.overallStats?.studentCount || 0,
    Assessments: data.overallStats?.totalAssessments || 0,
    'Avg Performance': `${data.overallStats?.performanceScore || 0}%`,
    '+': data.overallStats?.ratingDistribution?.EASILY_MEETING || 0,
    '=': data.overallStats?.ratingDistribution?.MEETING || 0,
    'x': data.overallStats?.ratingDistribution?.NEEDS_PRACTICE || 0,
  });

  // Class breakdown
  if (data.classStats && Array.isArray(data.classStats)) {
    data.classStats.forEach((cls) => {
      rows.push({
        Class: cls.className,
        Students: cls.studentCount,
        Assessments: cls.totalAssessments,
        'Avg Performance': `${cls.performanceScore}%`,
        '+': cls.ratingDistribution?.EASILY_MEETING || 0,
        '=': cls.ratingDistribution?.MEETING || 0,
        'x': cls.ratingDistribution?.NEEDS_PRACTICE || 0,
      });
    });
  }

  return rows;
};

/**
 * Generate PDF from report data
 * @param {Object} reportData - The report data to export
 * @param {string} reportType - Type of report
 * @param {Object} options - PDF options (title, etc.)
 * @returns {Promise<Buffer>} PDF file as buffer
 */
export const generatePDF = async (reportData, reportType, options = {}) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Add content based on report type
    switch (reportType) {
      case 'student':
        generateStudentPDF(doc, reportData, options);
        break;
      case 'student-subject':
        generateStudentSubjectPDF(doc, reportData, options);
        break;
      case 'strand':
        generateStrandPDF(doc, reportData, options);
        break;
      case 'outcome':
        generateOutcomePDF(doc, reportData, options);
        break;
      case 'class':
        generateClassSummaryPDF(doc, reportData, options);
        break;
      case 'school':
        generateSchoolSummaryPDF(doc, reportData, options);
        break;
      default:
        doc.text('Unknown report type');
    }

    doc.end();
  });
};

// PDF generation helpers
const addHeader = (doc, title, subtitle = '') => {
  doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
  if (subtitle) {
    doc.fontSize(12).font('Helvetica').text(subtitle, { align: 'center' });
  }
  doc.moveDown(2);
};

const addRatingLegend = (doc) => {
  doc.fontSize(10).font('Helvetica-Bold').text('Rating Legend:', { continued: false });
  doc.font('Helvetica')
    .text('+ Easily Meeting | = Meeting | x Needs Practice', { indent: 20 });
  doc.moveDown();
};

// Generate student PDF (By Learner) - matches getStudentReport API response
const generateStudentPDF = (doc, data, options) => {
  const studentName = `${data.student?.firstName || ''} ${data.student?.lastName || ''}`;
  addHeader(doc, 'Student Performance Report', studentName);

  if (data.student?.class) {
    doc.fontSize(10).text(`Class: ${data.student.class}`, { align: 'center' });
  }
  doc.moveDown();

  addRatingLegend(doc);

  // Summary stats
  doc.fontSize(12).font('Helvetica-Bold').text('Summary');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Total Assessments: ${data.overallStats?.totalAssessments || 0}`);
  doc.text(`Performance Score: ${data.overallStats?.performanceScore || 0}%`);
  doc.text(`Completion Rate: ${data.overallStats?.completionRate || 0}%`);
  doc.moveDown();

  // Subjects breakdown
  if (data.subjects && Array.isArray(data.subjects)) {
    data.subjects.forEach((subject) => {
      doc.fontSize(14).font('Helvetica-Bold').text(subject.subjectName);
      doc.fontSize(10).font('Helvetica')
        .text(`Performance: ${subject.performanceScore}% | Completion: ${subject.completionRate}%`);
      doc.moveDown(0.5);

      if (subject.strands && Array.isArray(subject.strands)) {
        subject.strands.forEach((strand) => {
          doc.fontSize(11).font('Helvetica-Bold').text(`  ${strand.strandName}`);
          doc.fontSize(10).font('Helvetica')
            .text(`    Performance: ${strand.performanceScore}%`);
        });
      }
      doc.moveDown();
    });
  }
};

// Generate student-subject PDF (Detailed Report)
const generateStudentSubjectPDF = (doc, data, options) => {
  const studentName = `${data.student?.firstName || ''} ${data.student?.lastName || ''}`;
  addHeader(doc, 'Detailed Student Report', studentName);

  doc.fontSize(10).text(`Subject: ${data.subject?.name || 'N/A'}`, { align: 'center' });
  if (data.student?.class) {
    doc.text(`Class: ${data.student.class}`, { align: 'center' });
  }
  doc.moveDown();

  addRatingLegend(doc);

  // Summary
  doc.fontSize(12).font('Helvetica-Bold').text('Summary');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Outcomes Assessed: ${data.summary?.assessedOutcomes || 0}/${data.summary?.totalOutcomes || 0}`);
  doc.text(`Completion Rate: ${data.summary?.completionRate || 0}%`);
  doc.text(`Performance Score: ${data.summary?.performanceScore || 0}%`);
  doc.moveDown();

  // Strands and outcomes
  if (data.strands && Array.isArray(data.strands)) {
    data.strands.forEach((strand) => {
      doc.fontSize(12).font('Helvetica-Bold').text(strand.name);
      doc.moveDown(0.5);

      if (strand.outcomes && Array.isArray(strand.outcomes)) {
        strand.outcomes.forEach((outcome) => {
          const dates = Object.keys(outcome.assessmentsByDate || {}).sort().reverse();
          const latestDate = dates[0] || '';
          const latestAssessment = outcome.assessmentsByDate?.[latestDate];
          const rating = latestAssessment?.rating ? RATING_SYMBOLS[latestAssessment.rating] : '-';

          doc.fontSize(10).font('Helvetica')
            .text(`  [${rating}] ${outcome.code}: ${outcome.description.substring(0, 60)}${outcome.description.length > 60 ? '...' : ''}`);
        });
      }
      doc.moveDown();
    });
  }
};

// Generate strand PDF (By Strand) - matches getStrandReport API response
const generateStrandPDF = (doc, data, options) => {
  addHeader(doc, 'Strand Report', data.strand?.name || 'N/A');

  if (data.strand?.subjectName) {
    doc.fontSize(10).text(`Subject: ${data.strand.subjectName}`, { align: 'center' });
  }
  if (data.class?.name) {
    doc.fontSize(10).text(`Class: ${data.class.name}`, { align: 'center' });
  }
  doc.moveDown();

  addRatingLegend(doc);

  // Overall stats
  doc.fontSize(12).font('Helvetica-Bold').text('Summary');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Total Students: ${data.overallStats?.totalStudents || 0}`);
  doc.text(`Average Completion: ${data.overallStats?.averageCompletion || 0}%`);
  doc.text(`Performance Score: ${data.overallStats?.performanceScore || 0}%`);
  doc.moveDown();

  // Create a simple table layout
  const startY = doc.y;
  const colWidth = 50;
  const rowHeight = 18;
  const maxOutcomes = Math.min(data.outcomes?.length || 0, 6); // Limit columns for PDF

  // Headers
  doc.fontSize(8).font('Helvetica-Bold');
  doc.text('Student', 50, startY);

  (data.outcomes || []).slice(0, maxOutcomes).forEach((outcome, i) => {
    doc.text(outcome.code, 130 + i * colWidth, startY, { width: colWidth - 5, align: 'center' });
  });
  doc.text('Score', 130 + maxOutcomes * colWidth, startY);

  // Student rows
  let y = startY + rowHeight;
  doc.font('Helvetica').fontSize(8);

  (data.studentMatrix || []).forEach((item) => {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }

    doc.text(`${item.student.firstName} ${item.student.lastName.charAt(0)}.`, 50, y);

    (data.outcomes || []).slice(0, maxOutcomes).forEach((outcome, i) => {
      const rating = item.outcomeRatings?.[outcome.id];
      doc.text(rating ? RATING_SYMBOLS[rating] : '-', 130 + i * colWidth, y, { width: colWidth - 5, align: 'center' });
    });

    doc.text(`${item.performanceScore}%`, 130 + maxOutcomes * colWidth, y);
    y += rowHeight;
  });
};

// Generate outcome PDF (By SCO) - matches getOutcomeReport API response
const generateOutcomePDF = (doc, data, options) => {
  const outcomeTitle = data.outcome?.code ? `${data.outcome.code}: ${data.outcome.description}` : 'N/A';
  addHeader(doc, 'Outcome Report', outcomeTitle);

  if (data.class?.name) {
    doc.fontSize(10).text(`Class: ${data.class.name}`, { align: 'center' });
  }
  doc.moveDown();

  addRatingLegend(doc);

  // Rating distribution
  doc.fontSize(12).font('Helvetica-Bold').text('Rating Distribution');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Easily Meeting (+): ${data.overallStats?.ratingDistribution?.EASILY_MEETING || 0}`);
  doc.text(`Meeting (=): ${data.overallStats?.ratingDistribution?.MEETING || 0}`);
  doc.text(`Needs Practice (x): ${data.overallStats?.ratingDistribution?.NEEDS_PRACTICE || 0}`);
  doc.text(`Not Assessed: ${data.overallStats?.notAssessed || 0}`);
  doc.moveDown();

  // Student list
  doc.fontSize(12).font('Helvetica-Bold').text('Student Results');
  doc.moveDown(0.5);

  (data.studentResults || []).forEach((result) => {
    const rating = result.latestRating ? RATING_SYMBOLS[result.latestRating] : '-';
    doc.fontSize(10).font('Helvetica')
      .text(`[${rating}] ${result.student.firstName} ${result.student.lastName}`);
    if (result.latestComment) {
      doc.fontSize(9).text(`    Comment: ${result.latestComment}`, { indent: 20 });
    }
  });
};

// Generate class summary PDF - matches getClassSummary API response
const generateClassSummaryPDF = (doc, data, options) => {
  addHeader(doc, 'Class Summary Report', data.class?.name || 'N/A');

  if (data.class?.teacher) {
    doc.fontSize(10).text(`Teacher: ${data.class.teacher}`, { align: 'center' });
  }
  doc.moveDown();

  // Summary stats
  doc.fontSize(12).font('Helvetica-Bold').text('Overview');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Total Students: ${data.overallStats?.studentCount || 0}`);
  doc.text(`Total Assessments: ${data.overallStats?.totalAssessments || 0}`);
  doc.text(`Performance Score: ${data.overallStats?.performanceScore || 0}%`);
  doc.text(`Completion Rate: ${data.overallStats?.completionRate || 0}%`);
  doc.moveDown();

  // Rating distribution
  doc.fontSize(12).font('Helvetica-Bold').text('Rating Distribution');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Easily Meeting (+): ${data.overallStats?.ratingDistribution?.EASILY_MEETING || 0}`);
  doc.text(`Meeting (=): ${data.overallStats?.ratingDistribution?.MEETING || 0}`);
  doc.text(`Needs Practice (x): ${data.overallStats?.ratingDistribution?.NEEDS_PRACTICE || 0}`);
  doc.moveDown();

  // Subject breakdown if available
  if (data.subjectSummary && data.subjectSummary.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('Performance by Subject');
    doc.moveDown(0.5);

    data.subjectSummary.forEach((subject) => {
      doc.fontSize(10).font('Helvetica')
        .text(`${subject.subjectName}: ${subject.performanceScore}% (${subject.totalAssessments} assessments)`);
    });
  }
};

// Generate school summary PDF - matches getSchoolSummary API response
const generateSchoolSummaryPDF = (doc, data, options) => {
  addHeader(doc, 'School Summary Report', data.school?.name || 'N/A');

  doc.moveDown();

  // School-wide stats
  doc.fontSize(12).font('Helvetica-Bold').text('School Overview');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Total Classes: ${data.overallStats?.classCount || 0}`);
  doc.text(`Total Students: ${data.overallStats?.studentCount || 0}`);
  doc.text(`Total Assessments: ${data.overallStats?.totalAssessments || 0}`);
  doc.text(`Performance Score: ${data.overallStats?.performanceScore || 0}%`);
  doc.moveDown();

  // Rating distribution
  doc.fontSize(12).font('Helvetica-Bold').text('Overall Rating Distribution');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Easily Meeting (+): ${data.overallStats?.ratingDistribution?.EASILY_MEETING || 0}`);
  doc.text(`Meeting (=): ${data.overallStats?.ratingDistribution?.MEETING || 0}`);
  doc.text(`Needs Practice (x): ${data.overallStats?.ratingDistribution?.NEEDS_PRACTICE || 0}`);
  doc.moveDown();

  // Class breakdown
  doc.fontSize(12).font('Helvetica-Bold').text('Class Performance');
  doc.moveDown(0.5);

  (data.classStats || []).forEach((cls) => {
    doc.fontSize(10).font('Helvetica-Bold').text(cls.className);
    doc.font('Helvetica').fontSize(9)
      .text(`  Students: ${cls.studentCount} | Assessments: ${cls.totalAssessments} | Score: ${cls.performanceScore}%`);
    doc.moveDown(0.5);
  });
};

export default {
  generateCSV,
  generatePDF,
};
