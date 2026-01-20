import { useState, useMemo } from 'react';
import { Download, Plus, Search, Filter, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCountries, useSchools, useSchoolTerms } from '../hooks/useSchools';
import { useStudents } from '../hooks/useStudents';
import { useSubjects, useLearningOutcomes } from '../hooks/useCurriculum';
import {
  useStudentAssessments,
  useOutcomeHistory,
  useCreateAssessment,
  useUpdateAssessment,
  useDeleteAssessment
} from '../hooks/useAssessments';

const AssessmentApp = () => {
  const { user, logout } = useAuth();

  // View state
  const [currentView, setCurrentView] = useState('data-entry');

  // Session state
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedStrand, setSelectedStrand] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Assessment state
  const [tempAssessments, setTempAssessments] = useState({});
  const [tempComments, setTempComments] = useState({});
  const [showHistoryFor, setShowHistoryFor] = useState(null);

  // Fetch data with React Query
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: schools = [], isLoading: loadingSchools } = useSchools(
    selectedCountry ? { countryId: selectedCountry } : {}
  );
  const { data: terms = [], isLoading: loadingTerms } = useSchoolTerms(selectedSchool);
  const { data: students = [], isLoading: loadingStudents } = useStudents(
    selectedSchool ? { schoolId: selectedSchool, isActive: true } : {}
  );
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const { data: outcomes = [], isLoading: loadingOutcomes } = useLearningOutcomes(
    selectedSubject ? { subjectId: selectedSubject } : {}
  );

  // Fetch assessments for selected student
  const { data: studentAssessments = [], isLoading: loadingAssessments } = useStudentAssessments(
    selectedStudent,
    selectedSubject ? { subjectId: selectedSubject } : {}
  );

  // Fetch outcome history when viewing history
  const { data: outcomeHistory = [] } = useOutcomeHistory(
    selectedStudent,
    showHistoryFor
  );

  // Mutations
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();

  // Get unique strands for current subject
  const currentStrands = useMemo(() => {
    if (!outcomes.length) return ['all'];
    const strands = new Set(outcomes.map(o => o.strand.name));
    return ['all', ...Array.from(strands)];
  }, [outcomes]);

  // Filter outcomes by strand and search
  const filteredOutcomes = useMemo(() => {
    let filtered = outcomes;

    if (selectedStrand !== 'all') {
      filtered = filtered.filter(o => o.strand.name === selectedStrand);
    }

    if (searchTerm) {
      filtered = filtered.filter(o =>
        o.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [outcomes, selectedStrand, searchTerm]);

  // Check if outcome has been assessed
  const hasBeenAssessed = (outcomeId) => {
    return studentAssessments.some(a => a.learningOutcomeId === outcomeId);
  };

  // Get latest assessment for outcome
  const getLatestAssessment = (outcomeId) => {
    const assessments = studentAssessments
      .filter(a => a.learningOutcomeId === outcomeId)
      .sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));
    return assessments[0] || null;
  };

  // Handle save assessment
  const handleSaveAssessment = async (outcome) => {
    const rating = tempAssessments[outcome.id];
    const comment = tempComments[outcome.id] || '';

    if (!rating || !selectedTerm) {
      alert('Please select a rating and ensure a term is selected');
      return;
    }

    try {
      await createAssessment.mutateAsync({
        studentId: selectedStudent,
        learningOutcomeId: outcome.id,
        termId: selectedTerm,
        assessmentDate: selectedDate,
        rating: rating, // EASILY_MEETING, MEETING, NEEDS_PRACTICE
        comment,
      });

      // Clear temp data
      const newTemp = { ...tempAssessments };
      delete newTemp[outcome.id];
      setTempAssessments(newTemp);

      const newComments = { ...tempComments };
      delete newComments[outcome.id];
      setTempComments(newComments);
    } catch (error) {
      alert('Failed to save assessment: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle update assessment
  const handleUpdateAssessment = async (assessmentId, data) => {
    try {
      await updateAssessment.mutateAsync({ id: assessmentId, data });
    } catch (error) {
      alert('Failed to update assessment: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle delete assessment
  const handleDeleteAssessment = async (assessmentId) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      await deleteAssessment.mutateAsync(assessmentId);
    } catch (error) {
      alert('Failed to delete assessment: ' + (error.message || 'Unknown error'));
    }
  };

  // Map rating symbols to API values
  const getRatingValue = (symbol) => {
    const map = { '+': 'EASILY_MEETING', '=': 'MEETING', 'x': 'NEEDS_PRACTICE' };
    return map[symbol];
  };

  const getRatingSymbol = (value) => {
    const map = { 'EASILY_MEETING': '+', 'MEETING': '=', 'NEEDS_PRACTICE': 'x' };
    return map[value];
  };

  const getRatingColor = (rating) => {
    const colors = {
      'EASILY_MEETING': 'bg-green-100 text-green-800',
      'MEETING': 'bg-blue-100 text-blue-800',
      'NEEDS_PRACTICE': 'bg-amber-100 text-amber-800',
    };
    return colors[rating] || 'bg-gray-100 text-gray-800';
  };

  // Calculate progress trend for an outcome
  const getProgressTrend = (assessments) => {
    if (assessments.length < 2) return 'stable';

    const sorted = [...assessments].sort((a, b) => new Date(a.assessmentDate) - new Date(b.assessmentDate));
    const ratingValues = { 'NEEDS_PRACTICE': 1, 'MEETING': 2, 'EASILY_MEETING': 3 };

    const first = ratingValues[sorted[0].rating];
    const last = ratingValues[sorted[sorted.length - 1].rating];

    if (last > first) return 'improving';
    if (last < first) return 'declining';
    return 'stable';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return '↗️';
    if (trend === 'declining') return '↘️';
    return '➡️';
  };

  const getTrendColor = (trend) => {
    if (trend === 'improving') return 'text-green-600';
    if (trend === 'declining') return 'text-red-600';
    return 'text-gray-600';
  };

  // Group assessments by outcome
  const groupAssessmentsByOutcome = (assessments) => {
    const grouped = {};
    assessments.forEach(assessment => {
      const outcomeId = assessment.learningOutcomeId;
      if (!grouped[outcomeId]) {
        grouped[outcomeId] = [];
      }
      grouped[outcomeId].push(assessment);
    });
    return grouped;
  };

  // Render learner reports view
  const renderLearnerReports = () => {
    if (!selectedStudent) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Please select a student to view reports</p>
        </div>
      );
    }

    if (loadingAssessments) {
      return <div className="text-center py-12">Loading assessments...</div>;
    }

    if (studentAssessments.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">No assessments recorded for this student yet</p>
        </div>
      );
    }

    // Group by subject
    const bySubject = {};
    studentAssessments.forEach(assessment => {
      const subjectName = assessment.learningOutcome.subject.name;
      if (!bySubject[subjectName]) {
        bySubject[subjectName] = [];
      }
      bySubject[subjectName].push(assessment);
    });

    // Group by outcome for trend analysis
    const byOutcome = groupAssessmentsByOutcome(studentAssessments);

    return (
      <div>
        {/* Student Selection for Reports */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            disabled={!selectedSchool || loadingStudents}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            <option value="">Select Student</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">
              {studentAssessments.filter(a => a.rating === 'EASILY_MEETING').length}
            </div>
            <div className="text-sm text-green-600">Easily Meeting</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700">
              {studentAssessments.filter(a => a.rating === 'MEETING').length}
            </div>
            <div className="text-sm text-blue-600">Meeting</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-700">
              {studentAssessments.filter(a => a.rating === 'NEEDS_PRACTICE').length}
            </div>
            <div className="text-sm text-amber-600">Needs Practice</div>
          </div>
        </div>

        {/* Reports by Subject */}
        {Object.entries(bySubject).map(([subjectName, assessments]) => (
          <div key={subjectName} className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{subjectName}</h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Code</th>
                    <th className="border px-4 py-2 text-left">Outcome</th>
                    <th className="border px-4 py-2 text-left">Strand</th>
                    <th className="border px-4 py-2 text-center">Assessments</th>
                    <th className="border px-4 py-2 text-center">Latest Rating</th>
                    <th className="border px-4 py-2 text-center">Trend</th>
                    <th className="border px-4 py-2 text-left">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    assessments.reduce((acc, assessment) => {
                      const outcomeId = assessment.learningOutcomeId;
                      if (!acc[outcomeId]) {
                        acc[outcomeId] = {
                          outcome: assessment.learningOutcome,
                          assessments: []
                        };
                      }
                      acc[outcomeId].assessments.push(assessment);
                      return acc;
                    }, {})
                  ).map(([outcomeId, data]) => {
                    const sortedAssessments = data.assessments.sort(
                      (a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate)
                    );
                    const latest = sortedAssessments[0];
                    const trend = getProgressTrend(data.assessments);

                    return (
                      <tr key={outcomeId} className="hover:bg-gray-50">
                        <td className="border px-4 py-2 font-mono text-sm">
                          {data.outcome.code}
                        </td>
                        <td className="border px-4 py-2">
                          {data.outcome.description}
                        </td>
                        <td className="border px-4 py-2 text-sm text-gray-600">
                          {data.outcome.strand.name}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          <button
                            onClick={() => setShowHistoryFor(outcomeId)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm underline"
                          >
                            {data.assessments.length} assessment{data.assessments.length > 1 ? 's' : ''}
                          </button>
                        </td>
                        <td className="border px-4 py-2 text-center">
                          <span className={`px-3 py-1 rounded font-semibold ${getRatingColor(latest.rating)}`}>
                            {getRatingSymbol(latest.rating)}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(latest.assessmentDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="border px-4 py-2 text-center">
                          <span className={`text-2xl ${getTrendColor(trend)}`}>
                            {getTrendIcon(trend)}
                          </span>
                          <div className="text-xs text-gray-600 capitalize">
                            {trend}
                          </div>
                        </td>
                        <td className="border px-4 py-2 text-sm text-gray-600">
                          {latest.comment || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Export button */}
        <div className="flex justify-end mt-6">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            <Download size={16} />
            Export Report to PDF
          </button>
        </div>
      </div>
    );
  };

  // Render analytics view
  const renderAnalytics = () => {
    if (!selectedSchool) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Please select a school to view analytics</p>
        </div>
      );
    }

    // Calculate school-wide statistics
    const totalStudents = students.length;
    const totalOutcomes = outcomes.length;

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">School Analytics</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border-2 border-indigo-200 rounded-lg p-6">
            <div className="text-3xl font-bold text-indigo-600">{totalStudents}</div>
            <div className="text-sm text-gray-600 mt-1">Active Students</div>
          </div>

          <div className="bg-white border-2 border-green-200 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-600">{totalOutcomes}</div>
            <div className="text-sm text-gray-600 mt-1">Learning Outcomes</div>
          </div>

          <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-600">{subjects.length}</div>
            <div className="text-sm text-gray-600 mt-1">Subject Areas</div>
          </div>

          <div className="bg-white border-2 border-amber-200 rounded-lg p-6">
            <div className="text-3xl font-bold text-amber-600">{terms.length}</div>
            <div className="text-sm text-gray-600 mt-1">Academic Terms</div>
          </div>
        </div>

        {/* Progress by Subject */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Assessment Progress by Subject</h3>
          <div className="space-y-4">
            {subjects.map(subject => {
              const subjectOutcomes = outcomes.filter(o => o.subjectId === subject.id);
              const totalForSubject = subjectOutcomes.length;

              return (
                <div key={subject.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">{subject.name}</span>
                    <span className="text-sm text-gray-600">
                      {totalForSubject} outcomes
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all"
                      style={{ width: '0%' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Data collection in progress
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Country-Level Data Tracking</h3>
          <p className="text-sm text-blue-800">
            Assessment data from this school contributes to national education statistics and helps
            inform curriculum development across the OECS region.
          </p>
        </div>
      </div>
    );
  };

  // Loading state
  if (loadingCountries || loadingSubjects) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading application...</div>
      </div>
    );
  }

  // Render data entry view
  const renderDataEntry = () => {
    if (!selectedStudent || !selectedSubject) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            Please select a student and subject to begin assessment
          </p>
        </div>
      );
    }

    if (loadingOutcomes) {
      return <div className="text-center py-12">Loading outcomes...</div>;
    }

    return (
      <div>
        {/* Search and filter */}
        <div className="mb-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search outcomes by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <select
            value={selectedStrand}
            onChange={(e) => setSelectedStrand(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            {currentStrands.map(strand => (
              <option key={strand} value={strand}>
                {strand === 'all' ? 'All Strands' : strand}
              </option>
            ))}
          </select>
        </div>

        {/* Outcomes list */}
        <div className="space-y-3">
          {filteredOutcomes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No outcomes found matching your criteria
            </div>
          ) : (
            filteredOutcomes.map(outcome => {
              const latestAssessment = getLatestAssessment(outcome.id);
              const currentRating = tempAssessments[outcome.id];

              return (
                <div
                  key={outcome.id}
                  className={`border rounded-lg p-4 ${
                    latestAssessment ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-indigo-600">
                          {outcome.code}
                        </span>
                        <span className="text-xs text-gray-500">
                          {outcome.strand.name}
                        </span>
                      </div>
                      <p className="text-gray-700">{outcome.description}</p>
                    </div>
                  </div>

                  {/* Show assessment history if exists */}
                  {latestAssessment && (
                    <div className="mb-3 p-3 bg-white rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Latest:</span>
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${getRatingColor(latestAssessment.rating)}`}>
                            {getRatingSymbol(latestAssessment.rating)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(latestAssessment.assessmentDate).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowHistoryFor(outcome.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          View History
                        </button>
                      </div>
                      {latestAssessment.comment && (
                        <p className="text-sm text-gray-600 mt-2">{latestAssessment.comment}</p>
                      )}
                    </div>
                  )}

                  {/* Assessment controls */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {['+', '=', 'x'].map(symbol => (
                        <button
                          key={symbol}
                          onClick={() => setTempAssessments({...tempAssessments, [outcome.id]: getRatingValue(symbol)})}
                          className={`px-6 py-2 rounded font-semibold transition-colors ${
                            currentRating === getRatingValue(symbol)
                              ? symbol === '+' ? 'bg-green-500 text-white'
                                : symbol === '=' ? 'bg-blue-500 text-white'
                                : 'bg-amber-500 text-white'
                              : symbol === '+' ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : symbol === '=' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Add comment (optional)..."
                      value={tempComments[outcome.id] || ''}
                      onChange={(e) => setTempComments({...tempComments, [outcome.id]: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />

                    <button
                      onClick={() => handleSaveAssessment(outcome)}
                      disabled={!currentRating || createAssessment.isPending}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createAssessment.isPending ? 'Saving...' : 'Save Assessment'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              OHPC Kindergarten Assessment System
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Logged in as</p>
                <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          {/* Session Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedSchool('');
                  setSelectedTerm('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Country</option>
                {countries.map(country => (
                  <option key={country.id} value={country.id}>{country.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <select
                value={selectedSchool}
                onChange={(e) => {
                  setSelectedSchool(e.target.value);
                  setSelectedTerm('');
                }}
                disabled={!selectedCountry || loadingSchools}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                <option value="">Select School</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                disabled={!selectedSchool || loadingTerms}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                <option value="">Select Term</option>
                {terms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.name} ({term.schoolYear})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Navigation Tabs */}
          <div className="flex gap-4 mb-6 border-b">
            {['data-entry', 'learner-reports', 'analytics'].map(view => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-4 py-2 font-semibold ${
                  currentView === view
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {view.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>

          {/* Student and Subject Selection (for data entry) */}
          {currentView === 'data-entry' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  disabled={!selectedSchool || loadingStudents}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedStrand('all');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* View Content */}
          {currentView === 'data-entry' && renderDataEntry()}
          {currentView === 'learner-reports' && renderLearnerReports()}
          {currentView === 'analytics' && renderAnalytics()}
        </div>
      </div>

      {/* Assessment History Modal */}
      {showHistoryFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Assessment History</h2>
              <button
                onClick={() => setShowHistoryFor(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {outcomeHistory.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No assessment history available</p>
            ) : (
              <div className="space-y-3">
                {outcomeHistory.map(assessment => (
                  <div key={assessment.id} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded font-semibold ${getRatingColor(assessment.rating)}`}>
                          {getRatingSymbol(assessment.rating)}
                        </span>
                        <div>
                          <p className="text-sm text-gray-600">
                            {new Date(assessment.assessmentDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {assessment.teacher?.name || 'Unknown Term'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAssessment(assessment.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    {assessment.comment && (
                      <p className="text-sm text-gray-700 mt-2">{assessment.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentApp;
