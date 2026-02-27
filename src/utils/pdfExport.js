// PDF Export Utilities
// OHPC Kindergarten Assessment Checklist — branded PDF reports

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/* ── Brand palette (RGB arrays for jsPDF) ─────────────────────────── */
const C = {
  navy:      [30,  58,  95],
  green:     [124, 179, 66],
  white:     [255, 255, 255],
  gray50:    [248, 250, 252],
  gray100:   [241, 245, 249],
  gray200:   [226, 232, 240],
  gray500:   [107, 114, 128],
  gray700:   [55,  65,  81],
  gray900:   [17,  24,  39],
  strandBg:  [235, 241, 252],
  strandText:[30,  58,  95],
  greenBg:   [236, 253, 245], greenText:  [21,  128, 61],
  blueBg:    [239, 246, 255], blueText:   [29,  78,  216],
  amberBg:   [255, 251, 235], amberText:  [146, 64,  14],
};

const RATING_SYMBOLS = {
  EASILY_MEETING: '+',
  MEETING:        '=',
  NEEDS_PRACTICE: 'x',
};

/* ── Shared drawing helpers ────────────────────────────────────────── */

/** Navy banner at top of page. Returns Y position after the banner. */
const drawBanner = (doc, subtitle, pageWidth) => {
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(...C.white);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('OECS Kindergarten Progress Checklist', pageWidth / 2, 10, { align: 'center' });
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8.5);
  doc.text(subtitle, pageWidth / 2, 18, { align: 'center' });
  doc.setTextColor(...C.gray900);
  return 30;
};

/** Two-column label/value info block. Returns Y after block. */
const drawInfoBlock = (doc, leftItems, rightItems, startY, pageWidth, margin) => {
  let y = startY;
  const midX = pageWidth / 2 + 5;
  doc.setFontSize(8.5);
  const rows = Math.max(leftItems.length, rightItems.length);
  for (let i = 0; i < rows; i++) {
    const l = leftItems[i];
    const r = rightItems[i];
    if (l) {
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...C.gray500);
      doc.text(l.label + ':', margin, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...C.gray900);
      doc.text(String(l.value ?? 'N/A'), margin + 24, y);
    }
    if (r) {
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...C.gray500);
      doc.text(r.label + ':', midX, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...C.gray900);
      doc.text(String(r.value ?? 'N/A'), midX + 24, y);
    }
    y += 6;
  }
  doc.setTextColor(...C.gray900);
  return y + 3;
};

/** Row of colored summary stat boxes. Returns Y after boxes. */
const drawSummaryBoxes = (doc, boxes, startY, pageWidth, margin) => {
  const gap  = 3;
  const boxW = (pageWidth - margin * 2 - gap * (boxes.length - 1)) / boxes.length;
  const boxH = 18;
  let x = margin;
  boxes.forEach(({ label, value, textColor, bgColor }) => {
    doc.setFillColor(...bgColor);
    doc.roundedRect(x, startY, boxW, boxH, 2, 2, 'F');
    doc.setDrawColor(...textColor);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, startY, boxW, boxH, 2, 2, 'S');
    doc.setTextColor(...textColor);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(13);
    doc.text(String(value), x + boxW / 2, startY + 10.5, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(6.5);
    doc.text(label, x + boxW / 2, startY + 16, { align: 'center' });
    x += boxW + gap;
  });
  doc.setTextColor(...C.gray900);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  return startY + boxH + 4;
};

/** Add branded footer to every page of the document. */
const addFooters = (doc, pageWidth, teacherName) => {
  const total   = doc.internal.getNumberOfPages();
  const genDate = format(new Date(), 'MMM dd, yyyy');
  const pageH   = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const y = pageH - 7;
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...C.gray500);
    doc.setDrawColor(...C.gray200);
    doc.setLineWidth(0.25);
    doc.line(14, y - 3, pageWidth - 14, y - 3);
    if (teacherName) doc.text(`Prepared by: ${teacherName}`, 14, y);
    doc.text(`Generated: ${genDate}`, pageWidth / 2, y, { align: 'center' });
    doc.text(`Page ${i} of ${total}`, pageWidth - 14, y, { align: 'right' });
  }
  doc.setTextColor(...C.gray900);
};

/* ── Student-Subject Report (primary parent-facing report) ─────────── */
/**
 * Export a detailed subject progress report for a single student.
 * Shows all outcomes grouped by strand with date columns and colour-coded ratings.
 * @param {Object} reportData - { student, subject, term, assessmentDates, strands, summary }
 * @param {Object} options    - { teacherName, schoolName }
 */
export const exportStudentSubjectReportPDF = (reportData, options = {}) => {
  const { student, subject, term, assessmentDates = [], strands = [], summary = {} } = reportData;
  const nDates = assessmentDates.length;

  const doc = new jsPDF({
    orientation: nDates > 3 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin    = 12;

  /* Banner */
  let curY = drawBanner(doc, `${subject?.name || ''} Progress Report`, pageWidth);

  /* Info block */
  const sy = term?.schoolYear ? ` (${term.schoolYear})` : '';
  curY = drawInfoBlock(
    doc,
    [
      { label: 'Learner', value: `${student?.firstName || ''} ${student?.lastName || ''}`.trim() },
      { label: 'Class',   value: student?.class  || 'N/A' },
      { label: 'School',  value: student?.school || options.schoolName || 'N/A' },
    ],
    [
      { label: 'Teacher', value: options.teacherName || 'N/A' },
      { label: 'Term',    value: term ? `${term.name}${sy}` : 'N/A' },
      { label: 'Date',    value: format(new Date(), 'MMM dd, yyyy') },
    ],
    curY, pageWidth, margin,
  );

  /* Summary boxes */
  const dist = summary.ratingDistribution || {};
  curY = drawSummaryBoxes(doc, [
    { label: '+ Easily Meeting',  value: dist.EASILY_MEETING || 0, textColor: C.greenText, bgColor: C.greenBg },
    { label: '= Meeting',          value: dist.MEETING        || 0, textColor: C.blueText,  bgColor: C.blueBg  },
    { label: 'x Needs Practice',  value: dist.NEEDS_PRACTICE || 0, textColor: C.amberText, bgColor: C.amberBg },
    {
      label: 'Outcomes Assessed',
      value: `${summary.assessedOutcomes || 0}/${summary.totalOutcomes || 0}`,
      textColor: C.navy,
      bgColor: C.gray100,
    },
  ], curY, pageWidth, margin);

  /* Legend */
  doc.setFontSize(7).setFont(undefined, 'italic').setTextColor(...C.gray500);
  doc.text('+  Easily Meeting Expectations    =  Meeting Expectations    x  Needs Practice', margin, curY);
  curY += 5;
  doc.setTextColor(...C.gray900);

  /* Build table */
  let head, body, columnStyles, didParseCell;
  const usableW = pageWidth - margin * 2;

  if (nDates === 0) {
    /* No assessments recorded yet — simplified outcome list */
    head = [['SCO No.', 'Learning Outcome', 'Status']];
    body = [];
    strands.forEach((strand) => {
      body.push([{
        content: strand.name,
        colSpan: 3,
        styles: { fillColor: C.strandBg, textColor: C.strandText, fontStyle: 'bold', fontSize: 8 },
      }]);
      strand.outcomes.forEach((o) => {
        body.push([
          o.code,
          o.description,
          { content: 'Not Assessed', styles: { textColor: C.gray500, fontStyle: 'italic' } },
        ]);
      });
    });
    columnStyles = {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: usableW - 16 - 36 },
      2: { cellWidth: 36 },
    };
    didParseCell = undefined;
  } else {
    /* Full date-column grid */
    head = [['SCO No.', 'Learning Outcome', ...assessmentDates.flatMap((d) => [
      format(new Date(d), 'MMM d'),
      'Comment',
    ])]];

    const ratingColIndices = new Set(assessmentDates.map((_, i) => 2 + i * 2));
    body = [];

    strands.forEach((strand) => {
      body.push([{
        content: strand.name,
        colSpan: 2 + nDates * 2,
        styles: {
          fillColor: C.strandBg,
          textColor: C.strandText,
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
        },
      }]);

      strand.outcomes.forEach((outcome) => {
        const row = [outcome.code, outcome.description]; // full description, no truncation
        assessmentDates.forEach((date) => {
          const a = outcome.assessmentsByDate?.[date];
          if (a) {
            row.push(RATING_SYMBOLS[a.rating] || '—');
            const comment = a.comment
              ? (a.comment.length > 80 ? a.comment.substring(0, 80) + '…' : a.comment)
              : '';
            row.push(comment);
          } else {
            row.push('—');
            row.push('');
          }
        });
        body.push(row);
      });
    });

    /* Column widths */
    const codeW    = 15;
    const ratingW  = 14;
    const commentW = Math.max(20, Math.min(38, (usableW - codeW - nDates * (ratingW + 22)) / Math.max(1, nDates)));
    const outcomeW = Math.max(40, usableW - codeW - nDates * (ratingW + commentW));

    columnStyles = {
      0: { cellWidth: codeW, halign: 'center' },
      1: { cellWidth: outcomeW },
    };
    assessmentDates.forEach((_, i) => {
      columnStyles[2 + i * 2]     = { cellWidth: ratingW, halign: 'center' };
      columnStyles[2 + i * 2 + 1] = { cellWidth: commentW };
    });

    /* Colour-code rating cells in the parse hook */
    didParseCell = (data) => {
      if (data.section !== 'body') return;
      if (!ratingColIndices.has(data.column.index)) return;
      const raw = data.cell.raw;
      if (raw === '+') {
        data.cell.styles.fillColor = C.greenBg;
        data.cell.styles.textColor = C.greenText;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize  = 10;
      } else if (raw === '=') {
        data.cell.styles.fillColor = C.blueBg;
        data.cell.styles.textColor = C.blueText;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize  = 10;
      } else if (raw === 'x') {
        data.cell.styles.fillColor = C.amberBg;
        data.cell.styles.textColor = C.amberText;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize  = 10;
      }
    };
  }

  autoTable(doc, {
    startY: curY,
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize:  7.5,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize:    7.5,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      textColor:   C.gray700,
      lineColor:   C.gray200,
      lineWidth:   0.2,
    },
    alternateRowStyles: { fillColor: C.gray50 },
    columnStyles,
    margin: { left: margin, right: margin, bottom: 14 },
    ...(didParseCell && { didParseCell }),
  });

  addFooters(doc, pageWidth, options.teacherName);

  const fname = [
    (student?.firstName || 'Student'),
    (student?.lastName  || ''),
    (subject?.name      || 'Report'),
    format(new Date(), 'yyyy-MM-dd'),
  ].join('_').replace(/\s+/g, '_') + '.pdf';

  doc.save(fname);
};

/* ── Student Summary Report (all subjects) ─────────────────────────── */
/**
 * Export an all-subjects progress summary for a single student.
 * @param {Object} student     - Student data
 * @param {Array}  assessments - [{ subject, assessments: [{code, description, rating, assessmentDate, comment}] }]
 * @param {Object} options     - { schoolName, termName, teacherName }
 */
export const exportStudentReportPDF = (student, assessments, options = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin    = 14;

  /* Banner */
  let curY = drawBanner(doc, 'Student Progress Report', pageWidth);

  /* Info block */
  const dob = student.dateOfBirth ? format(new Date(student.dateOfBirth), 'MMM dd, yyyy') : null;
  curY = drawInfoBlock(
    doc,
    [
      { label: 'Learner', value: `${student.firstName} ${student.lastName}` },
      { label: 'ID',      value: student.studentIdNumber || 'N/A' },
      ...(dob ? [{ label: 'DOB', value: dob }] : []),
    ],
    [
      { label: 'School', value: options.schoolName  || 'N/A' },
      { label: 'Term',   value: options.termName    || 'N/A' },
      { label: 'Teacher', value: options.teacherName || 'N/A' },
    ],
    curY, pageWidth, margin,
  );

  /* Summary boxes */
  const ratingCounts = { EASILY_MEETING: 0, MEETING: 0, NEEDS_PRACTICE: 0 };
  let totalAssessments = 0;
  assessments.forEach((subject) => {
    subject.assessments.forEach((a) => {
      ratingCounts[a.rating] = (ratingCounts[a.rating] || 0) + 1;
      totalAssessments++;
    });
  });

  curY = drawSummaryBoxes(doc, [
    { label: '+ Easily Meeting', value: ratingCounts.EASILY_MEETING, textColor: C.greenText, bgColor: C.greenBg },
    { label: '= Meeting',         value: ratingCounts.MEETING,        textColor: C.blueText,  bgColor: C.blueBg  },
    { label: 'x Needs Practice', value: ratingCounts.NEEDS_PRACTICE, textColor: C.amberText, bgColor: C.amberBg },
    { label: 'Total Assessed',   value: totalAssessments,            textColor: C.navy,      bgColor: C.gray100 },
  ], curY, pageWidth, margin);

  /* One table per subject */
  assessments.forEach((subjectData) => {
    if (curY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      curY = 15;
    }

    /* Subject heading */
    doc.setFontSize(10).setFont(undefined, 'bold').setTextColor(...C.navy);
    doc.text(subjectData.subject, margin, curY + 4);
    curY += 8;
    doc.setTextColor(...C.gray900);

    const tableData = subjectData.assessments.map((a) => [
      a.code || '',
      a.description || '',                   // full description
      getRatingLabel(a.rating),
      a.assessmentDate ? format(new Date(a.assessmentDate), 'MMM dd, yyyy') : 'N/A',
      a.comment
        ? (a.comment.length > 80 ? a.comment.substring(0, 80) + '…' : a.comment)
        : '',
    ]);

    autoTable(doc, {
      startY: curY,
      head: [['Code', 'Learning Outcome', 'Rating', 'Date', 'Comment']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 8, cellPadding: 2.5 },
      bodyStyles: { fontSize: 7.5, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, textColor: C.gray700, lineColor: C.gray200, lineWidth: 0.2 },
      alternateRowStyles: { fillColor: C.gray50 },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center' },
        1: { cellWidth: 72 },
        2: { cellWidth: 32 },
        3: { cellWidth: 26 },
        4: { cellWidth: 36 },
      },
      margin: { left: margin, right: margin, bottom: 14 },
      didParseCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 2) return;
        const raw = data.cell.raw;
        if (raw?.startsWith('+')) { data.cell.styles.fillColor = C.greenBg; data.cell.styles.textColor = C.greenText; data.cell.styles.fontStyle = 'bold'; }
        else if (raw?.startsWith('=')) { data.cell.styles.fillColor = C.blueBg;  data.cell.styles.textColor = C.blueText;  data.cell.styles.fontStyle = 'bold'; }
        else if (raw?.startsWith('x')) { data.cell.styles.fillColor = C.amberBg; data.cell.styles.textColor = C.amberText; data.cell.styles.fontStyle = 'bold'; }
      },
    });

    curY = (doc.lastAutoTable?.finalY || curY) + 8;
  });

  addFooters(doc, pageWidth, options.teacherName);

  const filename = `${student.firstName}_${student.lastName}_Progress_${format(new Date(), 'yyyy-MM-dd')}.pdf`.replace(/\s+/g, '_');
  doc.save(filename);
};

/* ── Class Summary Report ─────────────────────────────────────────── */
/**
 * Export a class-level summary report.
 * @param {Object} classData   - Class information
 * @param {Array}  students    - Students in the class
 * @param {Object} statistics  - Class statistics
 * @param {Object} options     - { schoolName, termName, teacherName }
 */
export const exportClassSummaryPDF = (classData, students, statistics, options = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin    = 14;

  /* Banner */
  let curY = drawBanner(doc, 'Class Summary Report', pageWidth);

  /* Info block */
  curY = drawInfoBlock(
    doc,
    [
      { label: 'Class',      value: classData.name },
      { label: 'Grade',      value: classData.gradeLevel    || 'N/A' },
      { label: 'Acad. Year', value: classData.academicYear  || 'N/A' },
    ],
    [
      { label: 'School',   value: options.schoolName  || 'N/A' },
      { label: 'Term',     value: options.termName    || 'N/A' },
      { label: 'Teacher',  value: options.teacherName || 'N/A' },
    ],
    curY, pageWidth, margin,
  );

  /* Summary boxes */
  const dist = statistics.ratingDistribution || {};
  curY = drawSummaryBoxes(doc, [
    { label: '+ Easily Meeting', value: dist.EASILY_MEETING || 0, textColor: C.greenText, bgColor: C.greenBg },
    { label: '= Meeting',         value: dist.MEETING        || 0, textColor: C.blueText,  bgColor: C.blueBg  },
    { label: 'x Needs Practice', value: dist.NEEDS_PRACTICE || 0, textColor: C.amberText, bgColor: C.amberBg },
    { label: 'Students',         value: students.length,          textColor: C.navy,      bgColor: C.gray100 },
  ], curY, pageWidth, margin);

  /* Quick stats row */
  doc.setFontSize(8).setFont(undefined, 'normal').setTextColor(...C.gray500);
  doc.text(
    `Completion Rate: ${statistics.completionRate?.percentage || 0}%   |   ` +
    `Overall Performance: ${statistics.performancePercentage || 0}%   |   ` +
    `Total Assessments: ${statistics.assessmentCount || 0}`,
    margin, curY,
  );
  curY += 7;
  doc.setTextColor(...C.gray900);

  /* Students needing attention */
  if (statistics.studentsNeedingAttention?.length > 0) {
    doc.setFontSize(10).setFont(undefined, 'bold').setTextColor(...C.navy);
    doc.text('Students Needing Attention', margin, curY);
    curY += 4;
    doc.setTextColor(...C.gray900);

    autoTable(doc, {
      startY: curY,
      head: [['Student Name', 'Assessments', 'Needs Practice %']],
      body: statistics.studentsNeedingAttention.map((s) => [
        `${s.firstName} ${s.lastName}`,
        String(s.assessmentCount),
        `${s.needsPracticePercentage}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [185, 28, 28], textColor: C.white, fontStyle: 'bold', fontSize: 8, cellPadding: 2.5 },
      bodyStyles: { fontSize: 8, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, textColor: C.gray700, lineColor: C.gray200, lineWidth: 0.2 },
      alternateRowStyles: { fillColor: C.gray50 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 35 }, 2: { cellWidth: 40 } },
      margin: { left: margin, right: margin, bottom: 14 },
    });
    curY = (doc.lastAutoTable?.finalY || curY) + 8;
  }

  /* Student roster */
  if (curY > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    curY = 15;
  }
  doc.setFontSize(10).setFont(undefined, 'bold').setTextColor(...C.navy);
  doc.text('Student Roster', margin, curY);
  curY += 4;
  doc.setTextColor(...C.gray900);

  autoTable(doc, {
    startY: curY,
    head: [['#', 'Student Name', 'Student ID', 'Assessments Recorded']],
    body: students.map((s, i) => [
      String(i + 1),
      `${s.firstName} ${s.lastName}`,
      s.studentIdNumber || 'N/A',
      String(s.assessmentCount || 0),
    ]),
    theme: 'grid',
    headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 8, cellPadding: 2.5 },
    bodyStyles: { fontSize: 8, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, textColor: C.gray700, lineColor: C.gray200, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: C.gray50 },
    columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 80 }, 2: { cellWidth: 40 }, 3: { cellWidth: 40 } },
    margin: { left: margin, right: margin, bottom: 14 },
  });

  addFooters(doc, pageWidth, options.teacherName);

  const filename = `${classData.name}_Summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`.replace(/\s+/g, '_');
  doc.save(filename);
};

/* ── Rating display helpers ────────────────────────────────────────── */
const getRatingLabel = (rating) => {
  switch (rating) {
    case 'EASILY_MEETING': return '+ Easily Meeting';
    case 'MEETING':        return '= Meeting';
    case 'NEEDS_PRACTICE': return 'x Needs Practice';
    default:               return rating || '—';
  }
};

export default {
  exportStudentReportPDF,
  exportClassSummaryPDF,
  exportStudentSubjectReportPDF,
};
