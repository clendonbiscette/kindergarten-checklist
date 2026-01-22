// PDF Export Utilities
// Generates PDF reports for students, classes, and assessments

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Export student progress report to PDF
 * @param {Object} student - Student data
 * @param {Array} assessments - Student's assessments grouped by subject
 * @param {Object} options - Export options (schoolName, termName, teacherName)
 */
export const exportStudentReportPDF = (student, assessments, options = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('Student Progress Report', pageWidth / 2, 20, { align: 'center' });

  // Student Info
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  const infoY = 35;
  doc.text(`Student Name: ${student.firstName} ${student.lastName}`, 14, infoY);
  doc.text(`Student ID: ${student.studentIdNumber || 'N/A'}`, 14, infoY + 7);

  if (student.dateOfBirth) {
    doc.text(`Date of Birth: ${format(new Date(student.dateOfBirth), 'MMM dd, yyyy')}`, 14, infoY + 14);
  }

  if (options.schoolName) {
    doc.text(`School: ${options.schoolName}`, 14, infoY + 21);
  }

  if (options.termName) {
    doc.text(`Term: ${options.termName}`, 14, infoY + 28);
  }

  doc.text(`Report Generated: ${format(new Date(), 'MMM dd, yyyy')}`, 14, infoY + 35);

  // Add line separator
  doc.setLineWidth(0.5);
  doc.line(14, infoY + 42, pageWidth - 14, infoY + 42);

  let currentY = infoY + 50;

  // Summary Statistics
  const totalAssessments = assessments.reduce((sum, subject) => sum + subject.assessments.length, 0);
  const ratingCounts = {
    EASILY_MEETING: 0,
    MEETING: 0,
    NEEDS_PRACTICE: 0
  };

  assessments.forEach(subject => {
    subject.assessments.forEach(assessment => {
      ratingCounts[assessment.rating]++;
    });
  });

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Summary', 14, currentY);
  currentY += 10;

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Assessments: ${totalAssessments}`, 14, currentY);
  doc.text(`Easily Meeting Expectations: ${ratingCounts.EASILY_MEETING}`, 14, currentY + 7);
  doc.text(`Meeting Expectations: ${ratingCounts.MEETING}`, 14, currentY + 14);
  doc.text(`Needs Practice: ${ratingCounts.NEEDS_PRACTICE}`, 14, currentY + 21);

  currentY += 35;

  // Assessments by Subject
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Assessment Details by Subject', 14, currentY);
  currentY += 10;

  assessments.forEach((subjectData, index) => {
    // Check if we need a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(subjectData.subject, 14, currentY);
    currentY += 7;

    // Create table for assessments
    const tableData = subjectData.assessments.map(assessment => [
      assessment.code || '',
      assessment.description?.substring(0, 60) + (assessment.description?.length > 60 ? '...' : ''),
      getRatingSymbol(assessment.rating),
      assessment.assessmentDate ? format(new Date(assessment.assessmentDate), 'MMM dd, yyyy') : 'N/A'
    ]);

    const tableResult = autoTable(doc, {
      startY: currentY,
      head: [['Code', 'Learning Outcome', 'Rating', 'Date']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 90 },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 }
      },
      margin: { left: 14 },
    });

    currentY = (doc.lastAutoTable?.finalY || tableResult?.finalY || currentY) + 10;
  });

  // Footer on last page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    if (options.teacherName) {
      doc.text(
        `Teacher: ${options.teacherName}`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }
  }

  // Save the PDF
  const filename = `${student.firstName}_${student.lastName}_Progress_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};

/**
 * Export class summary report to PDF
 * @param {Object} classData - Class information
 * @param {Array} students - Students in class
 * @param {Object} statistics - Class statistics
 * @param {Object} options - Export options
 */
export const exportClassSummaryPDF = (classData, students, statistics, options = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('Class Summary Report', pageWidth / 2, 20, { align: 'center' });

  // Class Info
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  const infoY = 35;
  doc.text(`Class: ${classData.name}`, 14, infoY);
  doc.text(`Grade Level: ${classData.gradeLevel}`, 14, infoY + 7);
  doc.text(`Academic Year: ${classData.academicYear}`, 14, infoY + 14);

  if (options.schoolName) {
    doc.text(`School: ${options.schoolName}`, 14, infoY + 21);
  }

  if (options.termName) {
    doc.text(`Term: ${options.termName}`, 14, infoY + 28);
  }

  doc.text(`Report Generated: ${format(new Date(), 'MMM dd, yyyy')}`, 14, infoY + 35);
  doc.text(`Total Students: ${students.length}`, 14, infoY + 42);

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(14, infoY + 50, pageWidth - 14, infoY + 50);

  let currentY = infoY + 60;

  // Class Statistics
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Class Statistics', 14, currentY);
  currentY += 10;

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Assessments Completed: ${statistics.assessmentCount || 0}`, 14, currentY);
  doc.text(`Assessment Completion Rate: ${statistics.completionRate?.percentage || 0}%`, 14, currentY + 7);
  doc.text(`Curriculum Coverage: ${statistics.coverage?.percentage || 0}%`, 14, currentY + 14);
  doc.text(`Overall Performance: ${statistics.performancePercentage || 0}%`, 14, currentY + 21);

  currentY += 35;

  // Rating Distribution
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Rating Distribution', 14, currentY);
  currentY += 7;

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  const dist = statistics.ratingDistribution || {};
  doc.text(`Easily Meeting: ${dist.EASILY_MEETING || 0}`, 14, currentY);
  doc.text(`Meeting: ${dist.MEETING || 0}`, 14, currentY + 7);
  doc.text(`Needs Practice: ${dist.NEEDS_PRACTICE || 0}`, 14, currentY + 14);

  currentY += 30;

  // Students needing attention
  if (statistics.studentsNeedingAttention?.length > 0) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Students Needing Attention', 14, currentY);
    currentY += 7;

    const tableData = statistics.studentsNeedingAttention.map(student => [
      `${student.firstName} ${student.lastName}`,
      student.assessmentCount.toString(),
      `${student.needsPracticePercentage}%`
    ]);

    const attentionTable = autoTable(doc, {
      startY: currentY,
      head: [['Student Name', 'Assessments', 'Needs Practice %']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14 }
    });

    currentY = (doc.lastAutoTable?.finalY || attentionTable?.finalY || currentY) + 15;
  }

  // Student roster with assessment counts
  if (currentY > 200) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Student Roster', 14, currentY);
  currentY += 7;

  const rosterData = students.map((student, index) => [
    (index + 1).toString(),
    `${student.firstName} ${student.lastName}`,
    student.studentIdNumber || 'N/A',
    student.assessmentCount?.toString() || '0'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Student Name', 'Student ID', 'Assessments']],
    body: rosterData,
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202], fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14 }
  });

  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    if (options.teacherName) {
      doc.text(
        `Teacher: ${options.teacherName}`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }
  }

  // Save
  const filename = `${classData.name}_Summary_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};

/**
 * Helper function to get rating symbol
 */
const getRatingSymbol = (rating) => {
  switch (rating) {
    case 'EASILY_MEETING':
      return '+ (Easily Meeting)';
    case 'MEETING':
      return '= (Meeting)';
    case 'NEEDS_PRACTICE':
      return 'x (Needs Practice)';
    default:
      return rating;
  }
};

/**
 * Export student-subject detailed report to PDF (matching template format)
 * Shows all assessments for a student in a specific subject with date columns
 * @param {Object} reportData - Data from useStudentSubjectReport hook
 * @param {Object} options - Export options
 */
export const exportStudentSubjectReportPDF = (reportData, options = {}) => {
  const { student, subject, term, assessmentDates, strands, summary } = reportData;

  const doc = new jsPDF({
    orientation: assessmentDates.length > 3 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(`${subject.name} Progress Report`, pageWidth / 2, 15, { align: 'center' });

  // Student Info Section
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  let infoY = 25;

  doc.text(`Learner: ${student.firstName} ${student.lastName}`, margin, infoY);
  doc.text(`Student ID: ${student.studentIdNumber || 'N/A'}`, pageWidth / 2, infoY);
  infoY += 6;

  doc.text(`Class: ${student.class || 'N/A'}`, margin, infoY);
  doc.text(`School: ${student.school || 'N/A'}`, pageWidth / 2, infoY);
  infoY += 6;

  if (term) {
    doc.text(`Term: ${term.name} (${term.schoolYear})`, margin, infoY);
  }
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy')}`, pageWidth / 2, infoY);
  infoY += 8;

  // Summary Stats
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Summary:', margin, infoY);
  doc.setFont(undefined, 'normal');
  doc.text(
    `Outcomes: ${summary.assessedOutcomes}/${summary.totalOutcomes} (${summary.completionRate}%) | ` +
    `Performance: ${summary.performanceScore}% | ` +
    `Ratings: +${summary.ratingDistribution.EASILY_MEETING} =${summary.ratingDistribution.MEETING} x${summary.ratingDistribution.NEEDS_PRACTICE}`,
    margin + 20,
    infoY
  );
  infoY += 4;

  // Rating Legend
  doc.setFontSize(9);
  doc.text('+ = Easily Meeting    = = Meeting    x = Needs Practice', margin, infoY);
  infoY += 6;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, infoY, pageWidth - margin, infoY);
  infoY += 5;

  // Build table data
  const tableHead = [
    ['SCO No.', 'Outcome', ...assessmentDates.flatMap(date => [
      format(new Date(date), 'MMM d'),
      'Comment'
    ])]
  ];

  const tableBody = [];

  strands.forEach((strand) => {
    // Add strand header row
    const strandRow = [{
      content: `Strand: ${strand.name}`,
      colSpan: 2 + assessmentDates.length * 2,
      styles: { fillColor: [219, 234, 254], fontStyle: 'bold', textColor: [30, 64, 175] }
    }];
    tableBody.push(strandRow);

    // Add outcome rows
    strand.outcomes.forEach((outcome) => {
      const row = [
        outcome.code,
        outcome.description.length > 60
          ? outcome.description.substring(0, 60) + '...'
          : outcome.description
      ];

      assessmentDates.forEach((date) => {
        const assessment = outcome.assessmentsByDate[date];
        if (assessment) {
          row.push(getRatingSymbolShort(assessment.rating));
          row.push(assessment.comment ?
            (assessment.comment.length > 20 ? assessment.comment.substring(0, 20) + '...' : assessment.comment)
            : '');
        } else {
          row.push('-');
          row.push('');
        }
      });

      tableBody.push(row);
    });
  });

  // If no assessment dates, add placeholder columns
  if (assessmentDates.length === 0) {
    tableHead[0].push('Rating', 'Comment');
    strands.forEach((strand) => {
      strand.outcomes.forEach((outcome, idx) => {
        if (idx === 0) {
          // Find the strand row we already added
        }
        const existingRow = tableBody.find(row =>
          row.length === 2 && row[0] === outcome.code
        );
        if (existingRow) {
          existingRow.push('-', '-');
        }
      });
    });
  }

  // Create the table
  autoTable(doc, {
    startY: infoY,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [66, 139, 202],
      fontSize: 8,
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: assessmentDates.length > 3 ? 50 : 70 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Footer on each page
      doc.setFontSize(8);
      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    },
  });

  // Save the PDF
  const filename = `${student.firstName}_${student.lastName}_${subject.name}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};

/**
 * Helper to get short rating symbol for PDF
 */
const getRatingSymbolShort = (rating) => {
  switch (rating) {
    case 'EASILY_MEETING':
      return '+';
    case 'MEETING':
      return '=';
    case 'NEEDS_PRACTICE':
      return 'x';
    default:
      return '-';
  }
};

export default {
  exportStudentReportPDF,
  exportClassSummaryPDF,
  exportStudentSubjectReportPDF
};
