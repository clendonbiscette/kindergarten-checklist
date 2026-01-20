// PDF Export Utilities
// Generates PDF reports for students, classes, and assessments

import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

    doc.autoTable({
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
      didDrawPage: (data) => {
        currentY = data.cursor.y + 10;
      }
    });

    currentY = doc.lastAutoTable.finalY + 10;
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

    doc.autoTable({
      startY: currentY,
      head: [['Student Name', 'Assessments', 'Needs Practice %']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 15;
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

  doc.autoTable({
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

export default {
  exportStudentReportPDF,
  exportClassSummaryPDF
};
