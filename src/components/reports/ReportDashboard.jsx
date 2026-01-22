import React, { useState } from 'react';
import { User, BookOpen, Target, Download, ArrowLeft, FileText } from 'lucide-react';
import ReportFilters from './ReportFilters';
import StudentReport from './StudentReport';
import StudentSubjectReport from './StudentSubjectReport';
import StrandReport from './StrandReport';
import OutcomeReport from './OutcomeReport';
import ReportExport from './ReportExport';
import { useStudentReport, useStudentSubjectReport, useStrandReport, useOutcomeReport } from '../../hooks/useReports';
import { exportStudentSubjectReportPDF } from '../../utils/pdfExport';

const REPORT_TYPES = {
  STUDENT: 'student',
  STUDENT_SUBJECT: 'student-subject',
  STRAND: 'strand',
  OUTCOME: 'outcome',
};

const ReportDashboard = ({
  students = [],
  classes = [],
  terms = [],
  subjects = [],
  strands = [],
  outcomes = [],
  defaultClassId = '',
  defaultTermId = '',
}) => {
  const [reportType, setReportType] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedStrandId, setSelectedStrandId] = useState('');
  const [selectedOutcomeId, setSelectedOutcomeId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId);
  const [selectedTermId, setSelectedTermId] = useState(defaultTermId);
  const [showExport, setShowExport] = useState(false);

  // Fetch report data
  const studentReport = useStudentReport(
    reportType === REPORT_TYPES.STUDENT ? selectedStudentId : null,
    { termId: selectedTermId }
  );

  // Fetch detailed student-subject report (matching template format)
  const studentSubjectReport = useStudentSubjectReport(
    reportType === REPORT_TYPES.STUDENT_SUBJECT ? selectedStudentId : null,
    reportType === REPORT_TYPES.STUDENT_SUBJECT ? selectedSubjectId : null,
    { termId: selectedTermId }
  );

  const strandReport = useStrandReport(
    reportType === REPORT_TYPES.STRAND ? selectedStrandId : null,
    { classId: selectedClassId, termId: selectedTermId }
  );

  const outcomeReport = useOutcomeReport(
    reportType === REPORT_TYPES.OUTCOME ? selectedOutcomeId : null,
    { classId: selectedClassId, termId: selectedTermId }
  );

  const handleSelectReportType = (type) => {
    setReportType(type);
    // Reset selections when changing report type
    setSelectedStudentId('');
    setSelectedSubjectId('');
    setSelectedStrandId('');
    setSelectedOutcomeId('');
  };

  const handleBack = () => {
    setReportType(null);
    setSelectedStudentId('');
    setSelectedSubjectId('');
    setSelectedStrandId('');
    setSelectedOutcomeId('');
  };

  // Handle PDF export for student-subject report
  const handleExportStudentSubjectPDF = () => {
    if (studentSubjectReport.data) {
      exportStudentSubjectReportPDF(studentSubjectReport.data);
    }
  };

  const getCurrentReportData = () => {
    switch (reportType) {
      case REPORT_TYPES.STUDENT:
        return studentReport.data;
      case REPORT_TYPES.STUDENT_SUBJECT:
        return studentSubjectReport.data;
      case REPORT_TYPES.STRAND:
        return strandReport.data;
      case REPORT_TYPES.OUTCOME:
        return outcomeReport.data;
      default:
        return null;
    }
  };

  const canExport = () => {
    return (
      (reportType === REPORT_TYPES.STUDENT && studentReport.data) ||
      (reportType === REPORT_TYPES.STUDENT_SUBJECT && studentSubjectReport.data) ||
      (reportType === REPORT_TYPES.STRAND && strandReport.data) ||
      (reportType === REPORT_TYPES.OUTCOME && outcomeReport.data)
    );
  };

  // Filter students by selected class
  const filteredStudents = selectedClassId
    ? students.filter((s) => s.classId === selectedClassId)
    : students;

  // Filter strands by selected subject
  const filteredStrands = strands;

  // Filter outcomes by selected strand
  const filteredOutcomes = selectedStrandId
    ? outcomes.filter((o) => o.strandId === selectedStrandId)
    : outcomes;

  // Report Type Selection Screen
  if (!reportType) {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <ReportFilters
          terms={terms}
          classes={classes}
          selectedTermId={selectedTermId}
          selectedClassId={selectedClassId}
          onTermChange={setSelectedTermId}
          onClassChange={setSelectedClassId}
          showTerm={true}
          showClass={true}
        />

        {/* Report Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleSelectReportType(REPORT_TYPES.STUDENT_SUBJECT)}
            className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md hover:border-indigo-300 border-2 border-transparent transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <FileText size={24} className="text-indigo-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800">Detailed Report</h3>
            </div>
            <p className="text-sm text-gray-600">
              View a student's complete assessment history for one subject with dates,
              ratings (+/=/x), and comments. Perfect for downloadable progress reports.
            </p>
          </button>

          <button
            onClick={() => handleSelectReportType(REPORT_TYPES.STUDENT)}
            className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md hover:border-blue-300 border-2 border-transparent transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <User size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800">By Learner</h3>
            </div>
            <p className="text-sm text-gray-600">
              View one student's performance across all subjects and strands. Great for
              individual progress tracking and parent conferences.
            </p>
          </button>

          <button
            onClick={() => handleSelectReportType(REPORT_TYPES.STRAND)}
            className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md hover:border-green-300 border-2 border-transparent transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <BookOpen size={24} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800">By Strand</h3>
            </div>
            <p className="text-sm text-gray-600">
              Compare all students' performance for a specific strand. Identify which
              outcomes need more attention across the class.
            </p>
          </button>

          <button
            onClick={() => handleSelectReportType(REPORT_TYPES.OUTCOME)}
            className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md hover:border-purple-300 border-2 border-transparent transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Target size={24} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800">By SCO</h3>
            </div>
            <p className="text-sm text-gray-600">
              See how each student performed on a specific learning outcome. Perfect for
              targeted intervention planning.
            </p>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Quick Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredStudents.length}</div>
              <div className="text-xs text-gray-500">Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{subjects.length}</div>
              <div className="text-xs text-gray-500">Subjects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{strands.length}</div>
              <div className="text-xs text-gray-500">Strands</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{outcomes.length}</div>
              <div className="text-xs text-gray-500">Outcomes</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Report View Screen
  return (
    <div className="space-y-4">
      {/* Header with Back and Export */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Report Types</span>
        </button>

        {canExport() && (
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        )}
      </div>

      {/* Report-specific Selection */}
      {reportType === REPORT_TYPES.STUDENT_SUBJECT && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Student
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300"
              >
                <option value="">Choose a student...</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300"
              >
                <option value="">Choose a subject...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {reportType === REPORT_TYPES.STUDENT && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Student
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full md:w-96 px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300"
          >
            <option value="">Choose a student...</option>
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {reportType === REPORT_TYPES.STRAND && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300"
              >
                <option value="">Choose a class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Strand
              </label>
              <select
                value={selectedStrandId}
                onChange={(e) => setSelectedStrandId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300"
              >
                <option value="">Choose a strand...</option>
                {filteredStrands.map((strand) => (
                  <option key={strand.id} value={strand.id}>
                    {strand.name} ({strand.subject?.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {reportType === REPORT_TYPES.OUTCOME && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300"
              >
                <option value="">Choose a class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Strand (optional)
              </label>
              <select
                value={selectedStrandId}
                onChange={(e) => setSelectedStrandId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300"
              >
                <option value="">All strands</option>
                {strands.map((strand) => (
                  <option key={strand.id} value={strand.id}>
                    {strand.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[300px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Outcome (SCO)
              </label>
              <select
                value={selectedOutcomeId}
                onChange={(e) => setSelectedOutcomeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300"
              >
                <option value="">Choose an outcome...</option>
                {filteredOutcomes.map((outcome) => (
                  <option key={outcome.id} value={outcome.id}>
                    {outcome.code} - {outcome.description.substring(0, 60)}...
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      {reportType === REPORT_TYPES.STUDENT_SUBJECT && (
        <StudentSubjectReport
          data={studentSubjectReport.data}
          isLoading={studentSubjectReport.isLoading}
          error={studentSubjectReport.error}
          onExportPDF={handleExportStudentSubjectPDF}
        />
      )}

      {reportType === REPORT_TYPES.STUDENT && (
        <StudentReport
          data={studentReport.data}
          isLoading={studentReport.isLoading}
          error={studentReport.error}
        />
      )}

      {reportType === REPORT_TYPES.STRAND && (
        <StrandReport
          data={strandReport.data}
          isLoading={strandReport.isLoading}
          error={strandReport.error}
        />
      )}

      {reportType === REPORT_TYPES.OUTCOME && (
        <OutcomeReport
          data={outcomeReport.data}
          isLoading={outcomeReport.isLoading}
          error={outcomeReport.error}
        />
      )}

      {/* Export Modal */}
      {showExport && (
        <ReportExport
          reportType={reportType}
          reportData={getCurrentReportData()}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default ReportDashboard;
