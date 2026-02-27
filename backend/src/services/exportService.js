import PDFDocument from 'pdfkit';
import { format } from 'fast-csv';

/* ── Brand colours (hex strings for PDFKit) ──────────────────────── */
const BRAND = {
  navy:      '#1E3A5F',
  navyDark:  '#142850',
  green:     '#7CB342',
  white:     '#FFFFFF',
  gray50:    '#F8FAFC',
  gray100:   '#F1F5F9',
  gray200:   '#E2E8F0',
  gray500:   '#6B7280',
  gray700:   '#374151',
  gray900:   '#111827',
  strandBg:  '#EBF2FF',
  strandText:'#1E3A5F',
  greenBg:   '#ECFDF5', greenText:  '#166534',
  blueBg:    '#EFF6FF', blueText:   '#1D4ED8',
  amberBg:   '#FFFBEB', amberText:  '#92400E',
  redBg:     '#FEF2F2', redText:    '#B91C1C',
};

/* Rating helpers */
const RATING_SYMBOLS = { EASILY_MEETING: '+', MEETING: '=', NEEDS_PRACTICE: 'x' };
const RATING_LABELS  = { EASILY_MEETING: 'Easily Meeting', MEETING: 'Meeting', NEEDS_PRACTICE: 'Needs Practice' };

const ratingColors = (rating) => {
  switch (rating) {
    case 'EASILY_MEETING': return { bg: BRAND.greenBg, text: BRAND.greenText };
    case 'MEETING':        return { bg: BRAND.blueBg,  text: BRAND.blueText  };
    case 'NEEDS_PRACTICE': return { bg: BRAND.amberBg, text: BRAND.amberText };
    default:               return { bg: BRAND.gray100, text: BRAND.gray500   };
  }
};

/* ── Page geometry ───────────────────────────────────────────────── */
const PAGE_W      = 595.28;   // A4 width in points
const PAGE_H      = 841.89;   // A4 height in points
const MARGIN      = 50;
const USABLE_W    = PAGE_W - MARGIN * 2;
const FOOTER_H    = 30;       // reserved at bottom for footer
const CONTENT_H   = PAGE_H - MARGIN - FOOTER_H;

/* ── Shared drawing helpers ─────────────────────────────────────── */

/**
 * Draw the navy banner header at the top of the first page.
 * Returns the Y position after the banner.
 */
const drawPageHeader = (doc, title, subtitle) => {
  const BANNER_H = 56;
  doc.rect(0, 0, PAGE_W, BANNER_H).fill(BRAND.navy);

  doc.fillColor(BRAND.white)
    .font('Helvetica-Bold')
    .fontSize(13)
    .text('OECS Kindergarten Progress Checklist', MARGIN, 14, {
      width: USABLE_W,
      align: 'center',
    });

  doc.fillColor(BRAND.white)
    .font('Helvetica')
    .fontSize(10)
    .text(title, MARGIN, 31, { width: USABLE_W, align: 'center' });

  if (subtitle) {
    doc.fillColor(BRAND.white)
      .font('Helvetica')
      .fontSize(8.5)
      .text(subtitle, MARGIN, 45, { width: USABLE_W, align: 'center' });
  }

  return BANNER_H + 10;
};

/**
 * Draw the page footer with teacher name, date, and page number.
 * Must be called after content is written for each page.
 */
const drawFooter = (doc, { teacherName, genDate, pageNum, totalPages }) => {
  const y = PAGE_H - FOOTER_H + 8;
  doc.moveTo(MARGIN, y - 4).lineTo(PAGE_W - MARGIN, y - 4).stroke(BRAND.gray200);
  doc.fillColor(BRAND.gray500).font('Helvetica').fontSize(7.5);
  if (teacherName) doc.text(`Prepared by: ${teacherName}`, MARGIN, y, { lineBreak: false });
  doc.text(`Generated: ${genDate}`, PAGE_W / 2 - 50, y, { width: 100, align: 'center', lineBreak: false });
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN - 60, y, { width: 60, align: 'right' });
};

/**
 * Draw a two-column info block (label: value pairs).
 * Returns Y after the block.
 */
const drawInfoBlock = (doc, leftItems, rightItems, startY) => {
  let y = startY;
  const midX   = MARGIN + USABLE_W / 2 + 10;
  const valOff = 75; // label column width
  const rows   = Math.max(leftItems.length, rightItems.length);

  doc.fontSize(8.5);
  for (let i = 0; i < rows; i++) {
    const l = leftItems[i];
    const r = rightItems[i];
    if (l) {
      doc.fillColor(BRAND.gray500).font('Helvetica-Bold')
        .text(l.label + ':', MARGIN, y, { width: valOff, lineBreak: false });
      doc.fillColor(BRAND.gray900).font('Helvetica')
        .text(String(l.value ?? 'N/A'), MARGIN + valOff, y, { lineBreak: false });
    }
    if (r) {
      doc.fillColor(BRAND.gray500).font('Helvetica-Bold')
        .text(r.label + ':', midX, y, { width: valOff, lineBreak: false });
      doc.fillColor(BRAND.gray900).font('Helvetica')
        .text(String(r.value ?? 'N/A'), midX + valOff, y, { lineBreak: false });
    }
    y += 14;
  }
  return y + 4;
};

/**
 * Draw a row of coloured summary stat boxes.
 * Returns Y after the boxes.
 */
const drawSummaryBoxes = (doc, boxes, startY) => {
  const gap  = 6;
  const boxW = (USABLE_W - gap * (boxes.length - 1)) / boxes.length;
  const boxH = 44;
  let x = MARGIN;
  boxes.forEach(({ label, value, bgColor, textColor }) => {
    doc.rect(x, startY, boxW, boxH).fill(bgColor);
    doc.fillColor(textColor)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(String(value), x, startY + 8, { width: boxW, align: 'center' });
    doc.fillColor(textColor)
      .font('Helvetica')
      .fontSize(7)
      .text(label, x, startY + 31, { width: boxW, align: 'center' });
    x += boxW + gap;
  });
  doc.fillColor(BRAND.gray900);
  return startY + boxH + 8;
};

/**
 * Draw a styled table with a navy header row and alternating striped body.
 * Handles page breaks automatically.
 * Returns the final Y position after the last row.
 *
 * @param {PDFDocument} doc
 * @param {string[]}    headers     - Column header labels
 * @param {Array[]}     rows        - Body rows; each cell may be a string or { text, color, align }
 * @param {number[]}    colWidths   - Width of each column (must sum ≤ USABLE_W)
 * @param {number}      startX      - X origin of the table
 * @param {number}      startY      - Y origin of the table
 * @param {Object}      [opts]
 * @param {number}      [opts.rowH=18] - Row height for body rows
 * @param {string}      [opts.teacherName]
 * @param {string}      [opts.genDate]
 * @param {Object}      [opts.pageCounter] - { current, total } — mutated during page breaks
 */
const drawTable = (doc, headers, rows, colWidths, startX, startY, opts = {}) => {
  const rowH = opts.rowH || 18;
  const tableW = colWidths.reduce((s, w) => s + w, 0);

  const drawHeaderRow = (y) => {
    doc.rect(startX, y, tableW, rowH).fill(BRAND.navy);
    let cx = startX;
    headers.forEach((h, i) => {
      doc.fillColor(BRAND.white)
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(h, cx + 4, y + 5, { width: colWidths[i] - 8, lineBreak: false, ellipsis: true });
      cx += colWidths[i];
    });
    return y + rowH;
  };

  let curY = drawHeaderRow(startY);

  rows.forEach((row, ri) => {
    // Page break
    if (curY + rowH > CONTENT_H) {
      if (opts.pageCounter) opts.pageCounter.current++;
      doc.addPage();
      curY = MARGIN;
      curY = drawHeaderRow(curY);
    }

    // Background
    doc.rect(startX, curY, tableW, rowH).fill(ri % 2 === 0 ? BRAND.gray50 : BRAND.white);

    // Cells
    let cx = startX;
    row.forEach((cell, ci) => {
      const txt   = typeof cell === 'object' ? (cell.text  ?? '') : String(cell ?? '');
      const color = typeof cell === 'object' ? (cell.color ?? BRAND.gray700) : BRAND.gray700;
      const align = typeof cell === 'object' ? (cell.align ?? 'left') : 'left';
      doc.fillColor(color)
        .font('Helvetica')
        .fontSize(7.5)
        .text(txt, cx + 4, curY + 5, { width: colWidths[ci] - 8, lineBreak: false, ellipsis: true, align });
      cx += colWidths[ci];
    });

    // Row border
    doc.moveTo(startX, curY + rowH).lineTo(startX + tableW, curY + rowH).stroke(BRAND.gray200);
    curY += rowH;
  });

  return curY;
};

/* ── CSV ─────────────────────────────────────────────────────────── */

/**
 * Generate CSV from report data.
 * @param {Object} reportData - The report data to export
 * @param {string} reportType - Type of report
 * @returns {Promise<Buffer>} CSV file as buffer
 */
export const generateCSV = async (reportData, reportType) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const csvStream = format({ headers: true });
    csvStream.on('data', (chunk) => chunks.push(chunk));
    csvStream.on('end',  () => resolve(Buffer.concat(chunks)));
    csvStream.on('error', reject);

    const rows = formatDataForCSV(reportData, reportType);
    rows.forEach((row) => csvStream.write(row));
    csvStream.end();
  });
};

const formatDataForCSV = (data, reportType) => {
  if (!data || typeof data !== 'object') {
    return [{ Error: 'No data available for export' }];
  }
  try {
    switch (reportType) {
      case 'student':         return formatStudentReportCSV(data);
      case 'student-subject': return formatStudentSubjectReportCSV(data);
      case 'strand':          return formatStrandReportCSV(data);
      case 'outcome':         return formatOutcomeReportCSV(data);
      case 'class':           return formatClassSummaryCSV(data);
      case 'school':          return formatSchoolSummaryCSV(data);
      default:                return [{ Error: `Unknown report type: ${reportType}` }];
    }
  } catch (error) {
    console.error('Export formatting error:', error);
    return [{ Error: `Export failed: ${error.message}` }];
  }
};

const formatStudentReportCSV = (data) => {
  const rows = [];
  if (!data.student) return [{ Error: 'Missing student data' }];

  rows.push({
    Subject: `Student: ${data.student.firstName || ''} ${data.student.lastName || ''}`,
    Strand:  `Class: ${data.student.class || 'N/A'}`,
    'Performance Score': `Overall: ${data.overallStats?.performanceScore || 0}%`,
    'Completion Rate':   `${data.overallStats?.completionRate || 0}%`,
    'Total Assessments': data.overallStats?.totalAssessments || 0,
  });
  rows.push({ Subject: '', Strand: '', 'Performance Score': '', 'Completion Rate': '', 'Total Assessments': '' });

  (data.subjects || []).forEach((subject) => {
    rows.push({
      Subject: subject.subjectName,
      Strand:  '',
      'Performance Score': `${subject.performanceScore}%`,
      'Completion Rate':   `${subject.completionRate}%`,
      'Total Assessments': subject.assessments?.length || 0,
    });
    (subject.strands || []).forEach((strand) => {
      rows.push({
        Subject: '',
        Strand:  `  ${strand.strandName}`,
        'Performance Score': `${strand.performanceScore}%`,
        'Completion Rate':   '',
        'Total Assessments': strand.assessments?.length || 0,
      });
    });
  });
  return rows;
};

const formatStudentSubjectReportCSV = (data) => {
  const rows = [];
  if (!data.student) return [{ Error: 'Missing student data' }];

  rows.push({
    Strand: `Student: ${data.student.firstName || ''} ${data.student.lastName || ''}`,
    'Outcome Code': `Subject: ${data.subject?.name || 'N/A'}`,
    Description: `Class: ${data.student.class || 'N/A'}`,
    Rating: '', Date: '',
  });
  rows.push({ Strand: '', 'Outcome Code': '', Description: '', Rating: '', Date: '' });

  (data.strands || []).forEach((strand) => {
    rows.push({ Strand: strand.name, 'Outcome Code': '', Description: '', Rating: '', Date: '' });
    (strand.outcomes || []).forEach((outcome) => {
      const dates = Object.keys(outcome.assessmentsByDate || {}).sort().reverse();
      const latestDate = dates[0] || '';
      const latestA    = outcome.assessmentsByDate?.[latestDate];
      rows.push({
        Strand: '',
        'Outcome Code': outcome.code,
        Description: outcome.description,
        Rating: latestA?.rating ? RATING_LABELS[latestA.rating] : 'Not Assessed',
        Date:   latestDate,
      });
    });
  });
  return rows;
};

const formatStrandReportCSV = (data) => {
  const rows = [];
  if (!data.strand) return [{ Error: 'Missing strand data' }];

  const outcomeHeaders = (data.outcomes || []).reduce((acc, o) => ({ ...acc, [o.code]: '' }), {});
  rows.push({
    Student: `Strand: ${data.strand?.name || 'N/A'} (${data.strand?.subjectName || ''})`,
    ...outcomeHeaders,
    'Performance Score': '',
  });

  (data.studentMatrix || []).forEach((item) => {
    const row = { Student: `${item.student?.firstName || ''} ${item.student?.lastName || ''}` };
    (data.outcomes || []).forEach((outcome) => {
      const rating = item.outcomeRatings?.[outcome.id];
      row[outcome.code] = rating ? RATING_SYMBOLS[rating] : '-';
    });
    row['Performance Score'] = `${item.performanceScore}%`;
    rows.push(row);
  });
  return rows;
};

const formatOutcomeReportCSV = (data) => {
  const rows = [];
  if (!data.outcome) return [{ Error: 'Missing outcome data' }];

  rows.push({
    Student: `Outcome: ${data.outcome?.code || 'N/A'} - ${data.outcome?.description || ''}`,
    Rating: '', Date: '', Comment: '',
  });
  rows.push({ Student: '', Rating: '', Date: '', Comment: '' });

  (data.studentResults || []).forEach((result) => {
    rows.push({
      Student: `${result.student?.firstName || ''} ${result.student?.lastName || ''}`,
      Rating:  result.latestRating ? RATING_LABELS[result.latestRating] : 'Not Assessed',
      Date:    result.latestDate ? new Date(result.latestDate).toLocaleDateString() : '',
      Comment: result.latestComment || '',
    });
  });
  return rows;
};

const formatClassSummaryCSV = (data) => {
  const rows = [];
  rows.push({ Metric: 'Class Summary',    Value: data.class?.name || 'N/A' });
  rows.push({ Metric: 'Total Students',   Value: data.overallStats?.studentCount || 0 });
  rows.push({ Metric: 'Total Assessments',Value: data.overallStats?.totalAssessments || 0 });
  rows.push({ Metric: 'Performance Score',Value: `${data.overallStats?.performanceScore || 0}%` });
  rows.push({ Metric: '', Value: '' });
  rows.push({ Metric: 'Rating Distribution', Value: '' });
  rows.push({ Metric: 'Easily Meeting (+)', Value: data.overallStats?.ratingDistribution?.EASILY_MEETING || 0 });
  rows.push({ Metric: 'Meeting (=)',         Value: data.overallStats?.ratingDistribution?.MEETING        || 0 });
  rows.push({ Metric: 'Needs Practice (x)', Value: data.overallStats?.ratingDistribution?.NEEDS_PRACTICE || 0 });
  return rows;
};

const formatSchoolSummaryCSV = (data) => {
  const rows = [];
  rows.push({
    Class: 'School Summary', Students: data.overallStats?.studentCount || 0,
    Assessments: data.overallStats?.totalAssessments || 0,
    'Avg Performance': `${data.overallStats?.performanceScore || 0}%`,
    '+': data.overallStats?.ratingDistribution?.EASILY_MEETING || 0,
    '=': data.overallStats?.ratingDistribution?.MEETING        || 0,
    'x': data.overallStats?.ratingDistribution?.NEEDS_PRACTICE || 0,
  });
  (data.classStats || []).forEach((cls) => {
    rows.push({
      Class: cls.className, Students: cls.studentCount,
      Assessments: cls.totalAssessments,
      'Avg Performance': `${cls.performanceScore}%`,
      '+': cls.ratingDistribution?.EASILY_MEETING || 0,
      '=': cls.ratingDistribution?.MEETING        || 0,
      'x': cls.ratingDistribution?.NEEDS_PRACTICE || 0,
    });
  });
  return rows;
};

/* ── PDF (PDFKit) ────────────────────────────────────────────────── */

/**
 * Generate PDF from report data.
 * @param {Object} reportData
 * @param {string} reportType
 * @param {Object} options
 * @returns {Promise<Buffer>}
 */
export const generatePDF = async (reportData, reportType, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!reportData || typeof reportData !== 'object') {
      const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(14).text('Export Error: No data available.', { align: 'center' });
      doc.end();
      return;
    }

    const chunks = [];
    const doc = new PDFDocument({ margin: MARGIN, size: 'A4', autoFirstPage: true });
    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      switch (reportType) {
        case 'student':         generateStudentPDF(doc, reportData, options); break;
        case 'student-subject': generateStudentSubjectPDF(doc, reportData, options); break;
        case 'strand':          generateStrandPDF(doc, reportData, options); break;
        case 'outcome':         generateOutcomePDF(doc, reportData, options); break;
        case 'class':           generateClassSummaryPDF(doc, reportData, options); break;
        case 'school':          generateSchoolSummaryPDF(doc, reportData, options); break;
        default: doc.text('Unknown report type');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      doc.fillColor(BRAND.gray900).fontSize(12).text(`Export Error: ${err.message}`, { align: 'center' });
    }

    doc.end();
  });
};

/* ── Student PDF (By Learner) ──────────────────────────────────── */
const generateStudentPDF = (doc, data, options) => {
  const studentName = `${data.student?.firstName || ''} ${data.student?.lastName || ''}`.trim();
  const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  let y = drawPageHeader(doc, 'Student Progress Report', studentName);

  y = drawInfoBlock(doc,
    [
      { label: 'Class',  value: data.student?.class || 'N/A' },
      { label: 'School', value: options.schoolName  || 'N/A' },
    ],
    [
      { label: 'Teacher', value: options.teacherName || 'N/A' },
      { label: 'Date',    value: genDate },
    ],
    y,
  );

  // Summary boxes
  const stats = data.overallStats || {};
  const dist  = stats.ratingDistribution || {};
  y = drawSummaryBoxes(doc, [
    { label: '+ Easily Meeting', value: dist.EASILY_MEETING || 0, bgColor: BRAND.greenBg, textColor: BRAND.greenText },
    { label: '= Meeting',         value: dist.MEETING        || 0, bgColor: BRAND.blueBg,  textColor: BRAND.blueText  },
    { label: 'x Needs Practice', value: dist.NEEDS_PRACTICE || 0, bgColor: BRAND.amberBg, textColor: BRAND.amberText },
    { label: 'Total Assessments',value: stats.totalAssessments || 0, bgColor: BRAND.gray100, textColor: BRAND.gray700 },
  ], y);

  // Subject breakdown table
  const rows = (data.subjects || []).map((s) => [
    s.subjectName,
    { text: `${s.performanceScore}%`, align: 'center', color: BRAND.navy },
    { text: `${s.completionRate}%`,   align: 'center' },
    { text: String(s.assessments?.length || 0), align: 'center' },
  ]);

  y = drawTable(doc,
    ['Subject', 'Performance', 'Completion', 'Assessments'],
    rows,
    [220, 90, 90, 95],
    MARGIN, y,
    { teacherName: options.teacherName, genDate },
  );

  // Footer
  drawFooter(doc, { teacherName: options.teacherName, genDate, pageNum: 1, totalPages: 1 });
};

/* ── Student-Subject PDF (Detailed Report, primary parent report) ── */
const generateStudentSubjectPDF = (doc, data, options) => {
  const studentName = `${data.student?.firstName || ''} ${data.student?.lastName || ''}`.trim();
  const subjectName = data.subject?.name || 'Subject Report';
  const sy          = data.term?.schoolYear ? ` (${data.term.schoolYear})` : '';
  const genDate     = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  let y = drawPageHeader(doc, subjectName + ' Progress Report', studentName);

  y = drawInfoBlock(doc,
    [
      { label: 'Class',   value: data.student?.class   || 'N/A' },
      { label: 'School',  value: data.student?.school  || options.schoolName || 'N/A' },
    ],
    [
      { label: 'Teacher', value: options.teacherName || 'N/A' },
      { label: 'Term',    value: data.term ? `${data.term.name}${sy}` : 'N/A' },
    ],
    y,
  );

  // Summary boxes
  const dist = data.summary?.ratingDistribution || {};
  y = drawSummaryBoxes(doc, [
    { label: '+ Easily Meeting',  value: dist.EASILY_MEETING || 0, bgColor: BRAND.greenBg, textColor: BRAND.greenText },
    { label: '= Meeting',          value: dist.MEETING        || 0, bgColor: BRAND.blueBg,  textColor: BRAND.blueText  },
    { label: 'x Needs Practice',  value: dist.NEEDS_PRACTICE || 0, bgColor: BRAND.amberBg, textColor: BRAND.amberText },
    {
      label: 'Outcomes Assessed',
      value: `${data.summary?.assessedOutcomes || 0}/${data.summary?.totalOutcomes || 0}`,
      bgColor: BRAND.gray100, textColor: BRAND.navy,
    },
  ], y);

  // Rating legend
  doc.fillColor(BRAND.gray500).font('Helvetica').fontSize(7.5)
    .text('+  Easily Meeting Expectations    =  Meeting Expectations    x  Needs Practice', MARGIN, y);
  y += 14;

  // Outcome list grouped by strand
  const PILL_W  = 18;
  const CODE_W  = 50;
  const DESC_W  = USABLE_W - PILL_W - CODE_W - 8;
  const ROW_H   = 18;
  let   pageNum = 1;

  (data.strands || []).forEach((strand) => {
    // Strand header bar
    if (y + ROW_H > CONTENT_H) {
      drawFooter(doc, { teacherName: options.teacherName, genDate, pageNum, totalPages: '—' });
      doc.addPage();
      pageNum++;
      y = MARGIN;
    }
    doc.rect(MARGIN, y, USABLE_W, 20).fill(BRAND.strandBg);
    doc.fillColor(BRAND.strandText).font('Helvetica-Bold').fontSize(9)
      .text(strand.name, MARGIN + 6, y + 6, { width: USABLE_W - 12, lineBreak: false });
    y += 24;

    (strand.outcomes || []).forEach((outcome) => {
      // Collect all assessments for this outcome (most recent first)
      const allDates = Object.keys(outcome.assessmentsByDate || {}).sort().reverse();
      const latest   = allDates[0] ? outcome.assessmentsByDate[allDates[0]] : null;
      const rating   = latest?.rating;
      const comment  = latest?.comment || '';
      const colors   = ratingColors(rating);
      const symbol   = rating ? RATING_SYMBOLS[rating] : '—';

      // Estimate row height (description may wrap)
      const estimatedDesc = doc.heightOfString(outcome.description, { width: DESC_W, font: 'Helvetica', fontSize: 8 });
      const cellH = Math.max(ROW_H, estimatedDesc + 12);

      if (y + cellH > CONTENT_H) {
        drawFooter(doc, { teacherName: options.teacherName, genDate, pageNum, totalPages: '—' });
        doc.addPage();
        pageNum++;
        y = MARGIN;
      }

      // Row background (alternating)
      const bgColor = (strand.outcomes.indexOf(outcome) % 2 === 0) ? BRAND.white : BRAND.gray50;
      doc.rect(MARGIN, y, USABLE_W, cellH).fill(bgColor);

      // Rating pill
      doc.rect(MARGIN, y, PILL_W, cellH).fill(colors.bg);
      doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(11)
        .text(symbol, MARGIN, y + cellH / 2 - 6, { width: PILL_W, align: 'center', lineBreak: false });

      // Outcome code
      doc.fillColor(BRAND.navy).font('Helvetica-Bold').fontSize(8)
        .text(outcome.code, MARGIN + PILL_W + 4, y + 5, { width: CODE_W - 4, lineBreak: false });

      // Description + comment
      doc.fillColor(BRAND.gray700).font('Helvetica').fontSize(8)
        .text(outcome.description, MARGIN + PILL_W + CODE_W, y + 5, { width: DESC_W, lineBreak: true });

      if (comment) {
        const commentY = y + 5 + estimatedDesc + 2;
        const trimmed  = comment.length > 120 ? comment.substring(0, 120) + '…' : comment;
        doc.fillColor(BRAND.gray500).font('Helvetica').fontSize(7)
          .text(`Note: ${trimmed}`, MARGIN + PILL_W + CODE_W, commentY, { width: DESC_W });
      }

      // Bottom border
      doc.moveTo(MARGIN, y + cellH).lineTo(MARGIN + USABLE_W, y + cellH).stroke(BRAND.gray200);
      y += cellH;
    });

    y += 6; // gap between strands
  });

  // Update total pages placeholder — PDFKit doesn't support deferred totals,
  // so we approximate. Draw footers for all pages.
  for (let p = 1; p <= pageNum; p++) {
    doc.switchToPage(p - 1);
    drawFooter(doc, { teacherName: options.teacherName, genDate, pageNum: p, totalPages: pageNum });
  }
};

/* ── Strand PDF (By Strand) ─────────────────────────────────────── */
const generateStrandPDF = (doc, data, options) => {
  const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  let y = drawPageHeader(doc, 'Strand Report', data.strand?.name || 'N/A');

  y = drawInfoBlock(doc,
    [
      { label: 'Subject', value: data.strand?.subjectName || 'N/A' },
      { label: 'Class',   value: data.class?.name         || 'N/A' },
    ],
    [
      { label: 'Teacher', value: options.teacherName || 'N/A' },
      { label: 'Date',    value: genDate },
    ],
    y,
  );

  const stats = data.overallStats || {};
  y = drawSummaryBoxes(doc, [
    { label: 'Students',         value: stats.totalStudents || 0,    bgColor: BRAND.gray100, textColor: BRAND.navy },
    { label: 'Avg Completion',   value: `${stats.averageCompletion || 0}%`, bgColor: BRAND.gray100, textColor: BRAND.gray700 },
    { label: 'Performance Score',value: `${stats.performanceScore  || 0}%`, bgColor: BRAND.gray100, textColor: BRAND.navy },
  ], y);

  // Limit outcomes to fit on page (outcomes become columns)
  const MAX_OUTCOMES = 8;
  const outcomes     = (data.outcomes || []).slice(0, MAX_OUTCOMES);
  const colW         = Math.floor((USABLE_W - 140) / Math.max(outcomes.length, 1));
  const colWidths    = [140, ...outcomes.map(() => colW), 50];

  const rows = (data.studentMatrix || []).map((item) => {
    const ratingCells = outcomes.map((o) => {
      const rating = item.outcomeRatings?.[o.id];
      if (!rating) return { text: '—', align: 'center', color: BRAND.gray500 };
      const colors = ratingColors(rating);
      return { text: RATING_SYMBOLS[rating], align: 'center', color: colors.text };
    });
    return [
      `${item.student?.firstName || ''} ${item.student?.lastName || ''}`,
      ...ratingCells,
      { text: `${item.performanceScore}%`, align: 'center', color: BRAND.navy },
    ];
  });

  y = drawTable(doc,
    ['Student', ...outcomes.map((o) => o.code), 'Score'],
    rows,
    colWidths,
    MARGIN, y,
    { teacherName: options.teacherName, genDate },
  );

  drawFooter(doc, { teacherName: options.teacherName, genDate, pageNum: 1, totalPages: 1 });
};

/* ── Outcome PDF (By SCO) ───────────────────────────────────────── */
const generateOutcomePDF = (doc, data, options) => {
  const genDate    = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const outcomeRef = data.outcome?.code ? `${data.outcome.code}: ${data.outcome.description}` : 'N/A';
  let y = drawPageHeader(doc, 'Outcome Report', outcomeRef.length > 80 ? outcomeRef.substring(0, 80) + '…' : outcomeRef);

  y = drawInfoBlock(doc,
    [{ label: 'Class',   value: data.class?.name      || 'N/A' }],
    [{ label: 'Teacher', value: options.teacherName   || 'N/A' }],
    y,
  );

  const dist = data.overallStats?.ratingDistribution || {};
  y = drawSummaryBoxes(doc, [
    { label: '+ Easily Meeting', value: dist.EASILY_MEETING || 0, bgColor: BRAND.greenBg, textColor: BRAND.greenText },
    { label: '= Meeting',         value: dist.MEETING        || 0, bgColor: BRAND.blueBg,  textColor: BRAND.blueText  },
    { label: 'x Needs Practice', value: dist.NEEDS_PRACTICE || 0, bgColor: BRAND.amberBg, textColor: BRAND.amberText },
    { label: 'Not Assessed',     value: data.overallStats?.notAssessed || 0, bgColor: BRAND.gray100, textColor: BRAND.gray500 },
  ], y);

  const rows = (data.studentResults || []).map((r) => {
    const rating  = r.latestRating;
    const colors  = ratingColors(rating);
    const symbol  = rating ? `${RATING_SYMBOLS[rating]} ${RATING_LABELS[rating]}` : '— Not Assessed';
    return [
      `${r.student?.firstName || ''} ${r.student?.lastName || ''}`,
      { text: symbol, color: colors.text },
      r.latestDate ? new Date(r.latestDate).toLocaleDateString() : '',
      r.latestComment || '',
    ];
  });

  y = drawTable(doc,
    ['Student', 'Rating', 'Date', 'Comment'],
    rows,
    [160, 120, 80, 135],
    MARGIN, y,
    { teacherName: options.teacherName, genDate },
  );

  drawFooter(doc, { teacherName: options.teacherName, genDate, pageNum: 1, totalPages: 1 });
};

/* ── Class Summary PDF ──────────────────────────────────────────── */
const generateClassSummaryPDF = (doc, data, options) => {
  const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  let y = drawPageHeader(doc, 'Class Summary Report', data.class?.name || 'N/A');

  y = drawInfoBlock(doc,
    [
      { label: 'Teacher', value: data.class?.teacher   || options.teacherName || 'N/A' },
      { label: 'School',  value: options.schoolName    || 'N/A' },
    ],
    [
      { label: 'Date', value: genDate },
    ],
    y,
  );

  const stats = data.overallStats || {};
  const dist  = stats.ratingDistribution || {};
  y = drawSummaryBoxes(doc, [
    { label: '+ Easily Meeting', value: dist.EASILY_MEETING || 0, bgColor: BRAND.greenBg, textColor: BRAND.greenText },
    { label: '= Meeting',         value: dist.MEETING        || 0, bgColor: BRAND.blueBg,  textColor: BRAND.blueText  },
    { label: 'x Needs Practice', value: dist.NEEDS_PRACTICE || 0, bgColor: BRAND.amberBg, textColor: BRAND.amberText },
    { label: 'Students',         value: stats.studentCount  || 0, bgColor: BRAND.gray100,  textColor: BRAND.navy      },
  ], y);

  // Stats row
  doc.fillColor(BRAND.gray500).font('Helvetica').fontSize(8)
    .text(
      `Completion Rate: ${stats.completionRate || 0}%    Performance: ${stats.performanceScore || 0}%    Total Assessments: ${stats.totalAssessments || 0}`,
      MARGIN, y, { width: USABLE_W, align: 'center' },
    );
  y += 18;

  // Subject performance
  if (data.subjectSummary?.length) {
    const rows = data.subjectSummary.map((s) => [
      s.subjectName,
      { text: `${s.performanceScore}%`, align: 'center', color: BRAND.navy },
      { text: String(s.totalAssessments), align: 'center' },
    ]);
    y = drawTable(doc,
      ['Subject', 'Performance', 'Assessments'],
      rows,
      [300, 100, 95],
      MARGIN, y,
    );
    y += 8;
  }

  drawFooter(doc, { teacherName: options.teacherName, genDate, pageNum: 1, totalPages: 1 });
};

/* ── School Summary PDF ─────────────────────────────────────────── */
const generateSchoolSummaryPDF = (doc, data, options) => {
  const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  let y = drawPageHeader(doc, 'School Summary Report', data.school?.name || 'N/A');

  y = drawInfoBlock(doc,
    [
      { label: 'Classes',  value: data.overallStats?.classCount   || 0 },
      { label: 'Students', value: data.overallStats?.studentCount || 0 },
    ],
    [
      { label: 'Performance', value: `${data.overallStats?.performanceScore || 0}%` },
      { label: 'Date',        value: genDate },
    ],
    y,
  );

  const dist = data.overallStats?.ratingDistribution || {};
  y = drawSummaryBoxes(doc, [
    { label: '+ Easily Meeting', value: dist.EASILY_MEETING || 0, bgColor: BRAND.greenBg, textColor: BRAND.greenText },
    { label: '= Meeting',         value: dist.MEETING        || 0, bgColor: BRAND.blueBg,  textColor: BRAND.blueText  },
    { label: 'x Needs Practice', value: dist.NEEDS_PRACTICE || 0, bgColor: BRAND.amberBg, textColor: BRAND.amberText },
    { label: 'Total Assessments',value: data.overallStats?.totalAssessments || 0, bgColor: BRAND.gray100, textColor: BRAND.navy },
  ], y);

  // Class breakdown
  const rows = (data.classStats || []).map((cls) => [
    cls.className,
    { text: String(cls.studentCount), align: 'center' },
    { text: String(cls.totalAssessments), align: 'center' },
    { text: `${cls.performanceScore}%`, align: 'center', color: BRAND.navy },
    { text: String(cls.ratingDistribution?.EASILY_MEETING || 0), align: 'center', color: BRAND.greenText },
    { text: String(cls.ratingDistribution?.MEETING        || 0), align: 'center', color: BRAND.blueText  },
    { text: String(cls.ratingDistribution?.NEEDS_PRACTICE || 0), align: 'center', color: BRAND.amberText },
  ]);

  y = drawTable(doc,
    ['Class', 'Students', 'Assessments', 'Performance', '+', '=', 'x'],
    rows,
    [160, 60, 70, 75, 45, 45, 40],
    MARGIN, y,
    { teacherName: options.teacherName, genDate },
  );

  drawFooter(doc, { teacherName: options.teacherName, genDate, pageNum: 1, totalPages: 1 });
};

export default { generateCSV, generatePDF };
