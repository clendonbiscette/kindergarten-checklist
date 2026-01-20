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
 * @param {string} reportType - Type of report (student, strand, outcome, class, school)
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

const formatStudentReportCSV = (data) => {
  const rows = [];

  // Add student info as header row
  rows.push({
    Subject: `Student: ${data.student.firstName} ${data.student.lastName}`,
    Strand: '',
    Outcome: '',
    Rating: '',
    Date: '',
    Comment: '',
  });

  // Add assessment data
  data.subjects.forEach((subject) => {
    subject.strands.forEach((strand) => {
      strand.outcomes.forEach((outcome) => {
        rows.push({
          Subject: subject.name,
          Strand: strand.name,
          Outcome: outcome.code,
          Rating: outcome.latestRating ? RATING_LABELS[outcome.latestRating] : 'Not Assessed',
          Date: outcome.assessedAt || '',
          Comment: outcome.comment || '',
        });
      });
    });
  });

  return rows;
};

const formatStrandReportCSV = (data) => {
  const rows = [];

  // Header with strand info
  rows.push({
    Student: `Strand: ${data.strand.name}`,
    ...data.outcomes.reduce((acc, o) => ({ ...acc, [o.code]: '' }), {}),
    'Performance Score': '',
  });

  // Student rows
  data.students.forEach((student) => {
    const row = {
      Student: `${student.firstName} ${student.lastName}`,
    };

    // Add rating for each outcome
    data.outcomes.forEach((outcome) => {
      const assessment = student.assessments.find(
        (a) => a.learningOutcomeId === outcome.id
      );
      row[outcome.code] = assessment ? RATING_SYMBOLS[assessment.rating] : '-';
    });

    row['Performance Score'] = `${student.performanceScore}%`;
    rows.push(row);
  });

  return rows;
};

const formatOutcomeReportCSV = (data) => {
  const rows = [];

  // Add outcome info
  rows.push({
    Student: `Outcome: ${data.outcome.code} - ${data.outcome.description}`,
    Rating: '',
    Date: '',
    Comment: '',
  });

  // Student assessments
  data.students.forEach((student) => {
    rows.push({
      Student: `${student.firstName} ${student.lastName}`,
      Rating: student.rating ? RATING_LABELS[student.rating] : 'Not Assessed',
      Date: student.assessedAt || '',
      Comment: student.comment || '',
    });
  });

  return rows;
};

const formatClassSummaryCSV = (data) => {
  const rows = [];

  // Summary info
  rows.push({
    Metric: 'Class Summary',
    Value: data.class.name,
  });
  rows.push({
    Metric: 'Total Students',
    Value: data.totalStudents,
  });
  rows.push({
    Metric: 'Total Assessments',
    Value: data.totalAssessments,
  });
  rows.push({
    Metric: 'Average Performance',
    Value: `${data.averagePerformance}%`,
  });

  // Rating distribution
  rows.push({ Metric: '', Value: '' });
  rows.push({ Metric: 'Rating Distribution', Value: '' });
  rows.push({
    Metric: 'Easily Meeting (+)',
    Value: data.ratingDistribution.EASILY_MEETING,
  });
  rows.push({
    Metric: 'Meeting (=)',
    Value: data.ratingDistribution.MEETING,
  });
  rows.push({
    Metric: 'Needs Practice (x)',
    Value: data.ratingDistribution.NEEDS_PRACTICE,
  });

  return rows;
};

const formatSchoolSummaryCSV = (data) => {
  const rows = [];

  // School summary
  rows.push({
    Class: 'School Summary',
    Students: data.totalStudents,
    Assessments: data.totalAssessments,
    'Avg Performance': `${data.averagePerformance}%`,
    '+': '',
    '=': '',
    'x': '',
  });

  // Class breakdown
  data.classes.forEach((cls) => {
    rows.push({
      Class: cls.name,
      Students: cls.studentCount,
      Assessments: cls.assessmentCount,
      'Avg Performance': `${cls.averagePerformance}%`,
      '+': cls.ratingDistribution.EASILY_MEETING,
      '=': cls.ratingDistribution.MEETING,
      'x': cls.ratingDistribution.NEEDS_PRACTICE,
    });
  });

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

const generateStudentPDF = (doc, data, options) => {
  const studentName = `${data.student.firstName} ${data.student.lastName}`;
  addHeader(doc, 'Student Performance Report', studentName);

  if (data.term) {
    doc.fontSize(10).text(`Term: ${data.term.name} (${data.term.schoolYear})`, { align: 'center' });
    doc.moveDown();
  }

  addRatingLegend(doc);

  // Summary stats
  doc.fontSize(12).font('Helvetica-Bold').text('Summary');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Total Assessments: ${data.summary.totalAssessments}`);
  doc.text(`Performance Score: ${data.summary.performanceScore}%`);
  doc.moveDown();

  // Subjects breakdown
  data.subjects.forEach((subject) => {
    doc.fontSize(14).font('Helvetica-Bold').text(subject.name);
    doc.moveDown(0.5);

    subject.strands.forEach((strand) => {
      doc.fontSize(11).font('Helvetica-Bold').text(`  ${strand.name}`);

      strand.outcomes.forEach((outcome) => {
        const rating = outcome.latestRating ? RATING_SYMBOLS[outcome.latestRating] : '-';
        doc.fontSize(10).font('Helvetica')
          .text(`    ${outcome.code}: [${rating}] ${outcome.description.substring(0, 50)}...`);
      });
      doc.moveDown(0.5);
    });
    doc.moveDown();
  });
};

const generateStrandPDF = (doc, data, options) => {
  addHeader(doc, 'Strand Report', data.strand.name);

  if (data.class) {
    doc.fontSize(10).text(`Class: ${data.class.name}`, { align: 'center' });
  }
  doc.moveDown();

  addRatingLegend(doc);

  // Create a simple table layout
  const startY = doc.y;
  const colWidth = 60;
  const rowHeight = 20;

  // Headers
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Student', 50, startY);

  data.outcomes.forEach((outcome, i) => {
    doc.text(outcome.code, 150 + i * colWidth, startY, { width: colWidth - 5, align: 'center' });
  });
  doc.text('Score', 150 + data.outcomes.length * colWidth, startY);

  // Student rows
  let y = startY + rowHeight;
  doc.font('Helvetica').fontSize(9);

  data.students.forEach((student) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.text(`${student.firstName} ${student.lastName.charAt(0)}.`, 50, y);

    data.outcomes.forEach((outcome, i) => {
      const assessment = student.assessments.find(
        (a) => a.learningOutcomeId === outcome.id
      );
      const rating = assessment ? RATING_SYMBOLS[assessment.rating] : '-';
      doc.text(rating, 150 + i * colWidth, y, { width: colWidth - 5, align: 'center' });
    });

    doc.text(`${student.performanceScore}%`, 150 + data.outcomes.length * colWidth, y);
    y += rowHeight;
  });
};

const generateOutcomePDF = (doc, data, options) => {
  addHeader(doc, 'Outcome Report', `${data.outcome.code}: ${data.outcome.description}`);

  doc.moveDown();
  addRatingLegend(doc);

  // Rating distribution
  doc.fontSize(12).font('Helvetica-Bold').text('Rating Distribution');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Easily Meeting (+): ${data.ratingDistribution.EASILY_MEETING}`);
  doc.text(`Meeting (=): ${data.ratingDistribution.MEETING}`);
  doc.text(`Needs Practice (x): ${data.ratingDistribution.NEEDS_PRACTICE}`);
  doc.moveDown();

  // Student list
  doc.fontSize(12).font('Helvetica-Bold').text('Student Results');
  doc.moveDown(0.5);

  data.students.forEach((student) => {
    const rating = student.rating ? RATING_SYMBOLS[student.rating] : '-';
    doc.fontSize(10).font('Helvetica')
      .text(`[${rating}] ${student.firstName} ${student.lastName}`);
    if (student.comment) {
      doc.fontSize(9).text(`    Comment: ${student.comment}`, { indent: 20 });
    }
  });
};

const generateClassSummaryPDF = (doc, data, options) => {
  addHeader(doc, 'Class Summary Report', data.class.name);

  if (data.term) {
    doc.fontSize(10).text(`Term: ${data.term.name}`, { align: 'center' });
  }
  doc.moveDown();

  // Summary stats
  doc.fontSize(12).font('Helvetica-Bold').text('Overview');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Total Students: ${data.totalStudents}`);
  doc.text(`Total Assessments: ${data.totalAssessments}`);
  doc.text(`Average Performance: ${data.averagePerformance}%`);
  doc.moveDown();

  // Rating distribution
  doc.fontSize(12).font('Helvetica-Bold').text('Rating Distribution');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Easily Meeting (+): ${data.ratingDistribution.EASILY_MEETING}`);
  doc.text(`Meeting (=): ${data.ratingDistribution.MEETING}`);
  doc.text(`Needs Practice (x): ${data.ratingDistribution.NEEDS_PRACTICE}`);
  doc.moveDown();

  // Subject breakdown if available
  if (data.subjectBreakdown && data.subjectBreakdown.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('Performance by Subject');
    doc.moveDown(0.5);

    data.subjectBreakdown.forEach((subject) => {
      doc.fontSize(10).font('Helvetica')
        .text(`${subject.name}: ${subject.averagePerformance}% (${subject.assessmentCount} assessments)`);
    });
  }
};

const generateSchoolSummaryPDF = (doc, data, options) => {
  addHeader(doc, 'School Summary Report', data.school.name);

  if (data.term) {
    doc.fontSize(10).text(`Term: ${data.term.name}`, { align: 'center' });
  }
  doc.moveDown();

  // School-wide stats
  doc.fontSize(12).font('Helvetica-Bold').text('School Overview');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Total Classes: ${data.classes.length}`);
  doc.text(`Total Students: ${data.totalStudents}`);
  doc.text(`Total Assessments: ${data.totalAssessments}`);
  doc.text(`Average Performance: ${data.averagePerformance}%`);
  doc.moveDown();

  // Rating distribution
  doc.fontSize(12).font('Helvetica-Bold').text('Overall Rating Distribution');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Easily Meeting (+): ${data.ratingDistribution.EASILY_MEETING}`);
  doc.text(`Meeting (=): ${data.ratingDistribution.MEETING}`);
  doc.text(`Needs Practice (x): ${data.ratingDistribution.NEEDS_PRACTICE}`);
  doc.moveDown();

  // Class breakdown
  doc.fontSize(12).font('Helvetica-Bold').text('Class Performance');
  doc.moveDown(0.5);

  data.classes.forEach((cls) => {
    doc.fontSize(10).font('Helvetica-Bold').text(cls.name);
    doc.font('Helvetica').fontSize(9)
      .text(`  Students: ${cls.studentCount} | Assessments: ${cls.assessmentCount} | Avg: ${cls.averagePerformance}%`);
    doc.moveDown(0.5);
  });
};

export default {
  generateCSV,
  generatePDF,
};