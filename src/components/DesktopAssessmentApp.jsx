import { useState, useMemo, useEffect } from 'react';
import {
  Download, Search, X, LogOut, Menu, ChevronRight,
  Home, FileText, BarChart3, User, School, Calendar,
  BookOpen, Users, TrendingUp, CheckCircle2, PlusCircle,
  UserPlus, GraduationCap, Edit2, Trash2, Upload
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useCountries, useSchools, useSchoolTerms } from '../hooks/useSchools';
import { useStudents } from '../hooks/useStudents';
import { useSubjects, useLearningOutcomes } from '../hooks/useCurriculum';
import {
  useStudentAssessments,
  useOutcomeHistory,
  useTermAssessments,
  useCreateAssessment,
  useUpdateAssessment,
  useDeleteAssessment
} from '../hooks/useAssessments';
import { useClasses, useDeleteClass } from '../hooks/useClasses';
import { useDeleteStudent, useAssignStudentToClass } from '../hooks/useStudents';
import ClassSetupModal from './ClassSetupModal';
import StudentEntryModal from './StudentEntryModal';
import ClassEditModal from './ClassEditModal';
import StudentEditModal from './StudentEditModal';
import BulkImportStudents from './BulkImportStudents';
import AssignStudentModal from './AssignStudentModal';
import BulkAssignStudents from './BulkAssignStudents';
import AssessmentEditModal from './AssessmentEditModal';
import ConfirmModal from './ConfirmModal';
import TeacherWelcome from './TeacherWelcome';
import AppFooter from './AppFooter';
import { saveSession, getSession } from '../utils/sessionStorage';
import { exportStudentReportPDF } from '../utils/pdfExport';
import { calculateClassStatistics, calculateRatingDistribution, calculateProgressBySubject } from '../utils/analyticsCalculations';
import { ReportDashboard } from './reports';
import { useStrands } from '../hooks/useCurriculum';

const DesktopAssessmentApp = () => {
  const { user, logout } = useAuth();
  const toast = useToast();

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('data-entry');
  const [showHistoryFor, setShowHistoryFor] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [showClassEditModal, setShowClassEditModal] = useState(false);
  const [showStudentEditModal, setShowStudentEditModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showAssessmentEditModal, setShowAssessmentEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingAssessment, setEditingAssessment] = useState(null);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, data: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Welcome guide state - check localStorage to see if user has dismissed it
  const [showWelcome, setShowWelcome] = useState(() => {
    const dismissed = localStorage.getItem('teacher_welcome_dismissed');
    return !dismissed;
  });

  const handleDismissWelcome = () => {
    localStorage.setItem('teacher_welcome_dismissed', 'true');
    setShowWelcome(false);
  };

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
  const [focusedOutcomeId, setFocusedOutcomeId] = useState(null);

  // Fetch data with React Query
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: schools = [] } = useSchools(selectedCountry ? { countryId: selectedCountry } : {});
  const { data: terms = [] } = useSchoolTerms(selectedSchool);
  const { data: students = [] } = useStudents(selectedSchool ? { schoolId: selectedSchool, isActive: true } : {});
  const { data: subjects = [] } = useSubjects();
  const { data: strands = [] } = useStrands();
  const { data: outcomes = [] } = useLearningOutcomes(selectedSubject ? { subjectId: selectedSubject } : {});
  const { data: allOutcomes = [] } = useLearningOutcomes({});
  // For Student Reports, fetch assessments filtered by term (if selected)
  const { data: studentAssessments = [] } = useStudentAssessments(
    selectedStudent,
    selectedTerm ? { termId: selectedTerm } : {}
  );
  const { data: outcomeHistory = [] } = useOutcomeHistory(selectedStudent, showHistoryFor);
  const { data: termAssessments = [] } = useTermAssessments(selectedTerm);
  const { data: classes = [] } = useClasses(
    selectedSchool ? { schoolId: selectedSchool, teacherId: user?.id } : {}
  );

  // Derived state - selected class object
  const selectedClassObj = useMemo(() =>
    classes.find(c => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  // Mutations
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();
  const deleteClass = useDeleteClass();
  const deleteStudent = useDeleteStudent();
  const assignStudentMutation = useAssignStudentToClass();

  // Track which student is being assigned (for loading state)
  const [assigningStudentId, setAssigningStudentId] = useState(null);

  // Restore session on mount, with user's assigned school/country as fallback
  useEffect(() => {
    const savedSession = getSession();
    if (savedSession) {
      if (savedSession.selectedCountry) setSelectedCountry(savedSession.selectedCountry);
      if (savedSession.selectedSchool) setSelectedSchool(savedSession.selectedSchool);
      if (savedSession.selectedTerm) setSelectedTerm(savedSession.selectedTerm);
      if (savedSession.selectedDate) setSelectedDate(savedSession.selectedDate);
      if (savedSession.selectedSubject) setSelectedSubject(savedSession.selectedSubject);
      if (savedSession.selectedStudent) setSelectedStudent(savedSession.selectedStudent);
      if (savedSession.currentView) setCurrentView(savedSession.currentView);
    } else {
      // No saved session - use user's assigned school/country from registration/login
      if (user?.countryId) {
        setSelectedCountry(user.countryId);
      }
      if (user?.schoolId) {
        setSelectedSchool(user.schoolId);
      }
    }
  }, [user?.countryId, user?.schoolId]);

  // Smart defaults: Auto-select country if only one available (and not already set by user assignment)
  useEffect(() => {
    if (!selectedCountry && countries.length === 1) {
      setSelectedCountry(countries[0].id);
    }
  }, [countries, selectedCountry]);

  // Smart defaults: Auto-select school if only one available (and not already set by user assignment)
  useEffect(() => {
    if (selectedCountry && !selectedSchool) {
      // Check if user has an assigned school in this country
      if (user?.schoolId && schools.some(s => s.id === user.schoolId)) {
        setSelectedSchool(user.schoolId);
      } else if (schools.length === 1) {
        setSelectedSchool(schools[0].id);
      }
    }
  }, [schools, selectedCountry, selectedSchool, user?.schoolId]);

  // Smart defaults: Auto-select current/active term
  useEffect(() => {
    if (selectedSchool && !selectedTerm && terms.length > 0) {
      // Try to find current term (today's date falls within term dates)
      const today = new Date();
      const currentTerm = terms.find(t => {
        const start = new Date(t.startDate);
        const end = new Date(t.endDate);
        return today >= start && today <= end;
      });

      if (currentTerm) {
        setSelectedTerm(currentTerm.id);
      } else if (terms.length === 1) {
        // If only one term, select it
        setSelectedTerm(terms[0].id);
      }
    }
  }, [terms, selectedSchool, selectedTerm]);

  // Smart defaults: Auto-select first subject if only one or none selected
  useEffect(() => {
    if (!selectedSubject && subjects.length === 1) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubject]);

  // Save session when key selections change
  useEffect(() => {
    saveSession({
      selectedCountry,
      selectedSchool,
      selectedTerm,
      selectedDate,
      selectedSubject,
      selectedStudent,
      currentView
    });
  }, [selectedCountry, selectedSchool, selectedTerm, selectedDate, selectedSubject, selectedStudent, currentView]);

  // Helper functions
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
      'EASILY_MEETING': 'bg-green-500 text-white',
      'MEETING': 'bg-blue-500 text-white',
      'NEEDS_PRACTICE': 'bg-amber-500 text-white',
    };
    return colors[rating] || 'bg-gray-400 text-white';
  };

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
    if (trend === 'improving') return '↗';
    if (trend === 'declining') return '↘';
    return '→';
  };

  const currentStrands = useMemo(() => {
    if (!outcomes.length) return ['all'];
    const strands = new Set(outcomes.map(o => o.strand.name));
    return ['all', ...Array.from(strands)];
  }, [outcomes]);

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

  const getLatestAssessment = (outcomeId) => {
    const assessments = studentAssessments
      .filter(a => a.learningOutcomeId === outcomeId)
      .sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));
    return assessments[0] || null;
  };

  const handleSaveAssessment = async (outcome) => {
    const rating = tempAssessments[outcome.id];
    const comment = tempComments[outcome.id] || '';

    if (!rating || !selectedTerm) {
      toast.warning('Please select a rating and ensure a term is selected');
      return;
    }

    try {
      await createAssessment.mutateAsync({
        studentId: selectedStudent,
        learningOutcomeId: outcome.id,
        termId: selectedTerm,
        assessmentDate: selectedDate,
        rating: rating,
        comment,
      });

      const newTemp = { ...tempAssessments };
      delete newTemp[outcome.id];
      setTempAssessments(newTemp);

      const newComments = { ...tempComments };
      delete newComments[outcome.id];
      setTempComments(newComments);

      toast.success('Assessment saved successfully');
    } catch (error) {
      toast.error('Failed to save assessment: ' + (error.message || 'Unknown error'));
    }
  };

  // Keyboard shortcuts for assessment ratings
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts when in data-entry view and an outcome is focused
      if (currentView !== 'data-entry' || !focusedOutcomeId) return;

      // Don't trigger shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const keyMap = {
        '1': 'EASILY_MEETING',  // 1 key = + (Easily Meeting)
        '+': 'EASILY_MEETING',
        '2': 'MEETING',         // 2 key = = (Meeting)
        '=': 'MEETING',
        '3': 'NEEDS_PRACTICE',  // 3 key = x (Needs Practice)
        'x': 'NEEDS_PRACTICE',
        'X': 'NEEDS_PRACTICE',
      };

      const rating = keyMap[e.key];
      if (rating) {
        e.preventDefault();
        setTempAssessments(prev => ({ ...prev, [focusedOutcomeId]: rating }));
      }

      // Enter key to save the focused outcome's assessment
      if (e.key === 'Enter' && tempAssessments[focusedOutcomeId]) {
        e.preventDefault();
        const outcome = filteredOutcomes.find(o => o.id === focusedOutcomeId);
        if (outcome) {
          handleSaveAssessment(outcome);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, focusedOutcomeId, tempAssessments, filteredOutcomes]);

  // Open confirm modal for different delete operations
  const openDeleteConfirm = (type, data) => {
    setConfirmModal({ isOpen: true, type, data });
  };

  const closeDeleteConfirm = () => {
    setConfirmModal({ isOpen: false, type: null, data: null });
  };

  const handleConfirmDelete = async () => {
    const { type, data } = confirmModal;
    setIsDeleting(true);

    try {
      if (type === 'assessment') {
        await deleteAssessment.mutateAsync(data.id);
        toast.success('Assessment deleted');
      } else if (type === 'class') {
        await deleteClass.mutateAsync(data.id);
        if (selectedClassId === data.id) {
          setSelectedClassId('');
        }
        toast.success(`Class "${data.name}" deleted successfully`);
      } else if (type === 'student') {
        await deleteStudent.mutateAsync(data.id);
        toast.success(`Student "${data.name}" removed successfully`);
      }
      closeDeleteConfirm();
    } catch (error) {
      toast.error(`Failed to delete ${type}: ` + (error.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAssessment = (assessmentId) => {
    openDeleteConfirm('assessment', { id: assessmentId });
  };

  const handleDeleteClass = (classId, className) => {
    openDeleteConfirm('class', { id: classId, name: className });
  };

  const handleDeleteStudent = (studentId, studentName) => {
    openDeleteConfirm('student', { id: studentId, name: studentName });
  };

  const handleEditClass = (classData) => {
    setEditingClass(classData);
    setShowClassEditModal(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowStudentEditModal(true);
  };

  // Direct assign student to class from the unassigned students grid
  const handleDirectAssign = async (studentId, classId, studentName, className) => {
    setAssigningStudentId(studentId);
    try {
      await assignStudentMutation.mutateAsync({ studentId, classId });
      toast.success(`${studentName} assigned to ${className}`);
    } catch (err) {
      toast.error(err.message || 'Failed to assign student');
    } finally {
      setAssigningStudentId(null);
    }
  };

  // Navigation items
  const navItems = [
    { id: 'data-entry', label: 'Assessment Entry', icon: FileText },
    { id: 'learner-reports', label: 'Student Reports', icon: User },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'class-management', label: 'Class Management', icon: GraduationCap },
  ];

  // PDF Export Handler
  const handleExportPDF = () => {
    if (!selectedStudent || !studentAssessments.length) {
      toast.warning('Please select a student with assessments to export');
      return;
    }

    const selectedStudentObj = students.find(s => s.id === selectedStudent);
    const selectedSchoolObj = schools.find(s => s.id === selectedSchool);
    const selectedTermObj = terms.find(t => t.id === selectedTerm);

    // Group assessments by subject
    const assessmentsBySubject = studentAssessments.reduce((acc, assessment) => {
      const outcome = outcomes.find(o => o.id === assessment.learningOutcomeId);
      if (!outcome) return acc;

      const subjectName = outcome.subject?.name || 'Unknown';
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          assessments: []
        };
      }

      acc[subjectName].assessments.push({
        code: outcome.code,
        description: outcome.description,
        rating: assessment.rating,
        comment: assessment.comment,
        assessmentDate: assessment.assessmentDate
      });

      return acc;
    }, {});

    const assessmentsArray = Object.values(assessmentsBySubject);

    exportStudentReportPDF(
      selectedStudentObj,
      assessmentsArray,
      {
        schoolName: selectedSchoolObj?.name,
        termName: selectedTermObj?.name,
        teacherName: `${user?.firstName} ${user?.lastName}`
      }
    );
  };

  // Render views (simplified versions - you can expand these)
  const renderDataEntry = () => {
    if (!selectedTerm) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600 font-medium">Select a term to begin assessments</p>
            <p className="text-sm text-gray-500 mt-1">All assessments are recorded within a specific academic term</p>
          </div>
        </div>
      );
    }

    if (!selectedStudent || !selectedSubject) {
      // Show quick stats summary when term is selected but student/subject not yet selected
      const termStudentCount = students.length;
      const termAssessmentCount = termAssessments.length;
      const studentsWithAssessments = new Set(termAssessments.map(a => a.studentId)).size;
      const recentAssessments = termAssessments
        .sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate))
        .slice(0, 5);

      return (
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{termStudentCount}</div>
                  <div className="text-xs text-gray-500">Active Students</div>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{termAssessmentCount}</div>
                  <div className="text-xs text-gray-500">Assessments This Term</div>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp size={20} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{studentsWithAssessments}</div>
                  <div className="text-xs text-gray-500">Students Assessed</div>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <BookOpen size={20} className="text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{subjects.length}</div>
                  <div className="text-xs text-gray-500">Subjects Available</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {recentAssessments.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp size={18} />
                Recent Activity
              </h3>
              <div className="space-y-2">
                {recentAssessments.map(assessment => {
                  const student = students.find(s => s.id === assessment.studentId);
                  return (
                    <div key={assessment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${getRatingColor(assessment.rating)}`}>
                          {getRatingSymbol(assessment.rating)}
                        </span>
                        <span className="text-sm text-gray-700">
                          {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(assessment.assessmentDate).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Call to action */}
          <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-gray-600 font-medium">Select a student and subject to begin assessment</p>
              <p className="text-sm text-gray-500 mt-1">Use the sidebar to choose who you want to assess</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-lg shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search outcomes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:border-gray-300"
            />
          </div>
          <select
            value={selectedStrand}
            onChange={(e) => setSelectedStrand(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-gray-300 min-w-[200px]"
          >
            {currentStrands.map(strand => (
              <option key={strand} value={strand}>
                {strand === 'all' ? 'All Strands' : strand}
              </option>
            ))}
          </select>
        </div>

        {/* Keyboard shortcut hint */}
        {focusedOutcomeId && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 text-sm text-indigo-800 flex items-center gap-4">
            <span className="font-medium">Keyboard shortcuts:</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">1</kbd> or <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">+</kbd> = Easily Meeting</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">2</kbd> or <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">=</kbd> = Meeting</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">3</kbd> or <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">x</kbd> = Needs Practice</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">Enter</kbd> = Save</span>
          </div>
        )}

        {/* Outcomes */}
        <div className="space-y-2">
          {filteredOutcomes.map(outcome => {
            const latestAssessment = getLatestAssessment(outcome.id);
            const currentRating = tempAssessments[outcome.id];
            const isFocused = focusedOutcomeId === outcome.id;

            return (
              <div
                key={outcome.id}
                onClick={() => setFocusedOutcomeId(outcome.id)}
                onFocus={() => setFocusedOutcomeId(outcome.id)}
                tabIndex={0}
                className={`bg-white rounded-lg p-3 transition-all cursor-pointer ${
                  isFocused
                    ? 'ring-2 ring-indigo-500 shadow-lg'
                    : 'shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                  {/* Outcome info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold px-2 py-1 bg-gray-100 rounded">
                        {outcome.code}
                      </span>
                      <span className="text-xs text-gray-500 truncate">{outcome.strand.name}</span>
                      {isFocused && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-tight">{outcome.description}</p>

                    {latestAssessment && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Previous:</span>
                        <span className={`px-2 py-0.5 rounded font-semibold ${getRatingColor(latestAssessment.rating)}`}>
                          {getRatingSymbol(latestAssessment.rating)}
                        </span>
                        <span className="text-gray-500">
                          {new Date(latestAssessment.assessmentDate).toLocaleDateString()}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowHistoryFor(outcome.id); }}
                          className="text-blue-600 hover:underline ml-2"
                        >
                          History
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Assessment controls */}
                  <div className="flex-shrink-0 space-y-2 lg:w-64">
                    <div className="flex gap-2">
                      {[
                        { symbol: '+', key: '1', rating: 'EASILY_MEETING' },
                        { symbol: '=', key: '2', rating: 'MEETING' },
                        { symbol: 'x', key: '3', rating: 'NEEDS_PRACTICE' }
                      ].map(({ symbol, key, rating }) => (
                        <button
                          key={symbol}
                          onClick={(e) => { e.stopPropagation(); setTempAssessments({...tempAssessments, [outcome.id]: rating}); }}
                          className={`flex-1 h-10 rounded font-bold transition-all relative ${
                            currentRating === rating
                              ? symbol === '+' ? 'bg-green-500 text-white ring-2 ring-green-600'
                                : symbol === '=' ? 'bg-blue-500 text-white ring-2 ring-blue-600'
                                : 'bg-amber-500 text-white ring-2 ring-amber-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={`Press ${key} or ${symbol} when this outcome is selected`}
                        >
                          {symbol}
                          {isFocused && (
                            <span className="absolute -top-1 -right-1 text-[10px] bg-gray-800 text-white w-4 h-4 rounded-full flex items-center justify-center">
                              {key}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Comment (optional)"
                      value={tempComments[outcome.id] || ''}
                      onChange={(e) => setTempComments({...tempComments, [outcome.id]: e.target.value})}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-gray-300"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSaveAssessment(outcome); }}
                      disabled={!currentRating || createAssessment.isPending}
                      className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {createAssessment.isPending ? 'Saving...' : (isFocused ? 'Save (Enter)' : 'Save')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLearnerReports = () => {
    if (!selectedStudent) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">Select a student to view reports</p>
        </div>
      );
    }

    if (!selectedTerm) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">Select a term to view student reports</p>
        </div>
      );
    }

    if (studentAssessments.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">No assessments recorded for this student in {terms.find(t => t.id === selectedTerm)?.name || 'this term'}</p>
        </div>
      );
    }

    // Group by subject
    const bySubject = {};
    studentAssessments.forEach(assessment => {
      const subjectName = assessment.learningOutcome.subject.name;
      if (!bySubject[subjectName]) bySubject[subjectName] = [];
      bySubject[subjectName].push(assessment);
    });

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50/80 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">
              {studentAssessments.filter(a => a.rating === 'EASILY_MEETING').length}
            </div>
            <div className="text-xs text-green-600">Easily Meeting</div>
          </div>
          <div className="bg-blue-50/80 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700">
              {studentAssessments.filter(a => a.rating === 'MEETING').length}
            </div>
            <div className="text-xs text-blue-600">Meeting</div>
          </div>
          <div className="bg-amber-50/80 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-700">
              {studentAssessments.filter(a => a.rating === 'NEEDS_PRACTICE').length}
            </div>
            <div className="text-xs text-amber-600">Needs Practice</div>
          </div>
        </div>

        {/* Reports by subject */}
        {Object.entries(bySubject).map(([subjectName, assessments]) => {
          // Group by outcome
          const byOutcome = {};
          assessments.forEach(a => {
            if (!byOutcome[a.learningOutcomeId]) byOutcome[a.learningOutcomeId] = { outcome: a.learningOutcome, assessments: [] };
            byOutcome[a.learningOutcomeId].assessments.push(a);
          });

          return (
            <div key={subjectName} className="bg-white shadow-sm rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <BookOpen size={18} />
                {subjectName}
              </h3>
              <div className="space-y-2">
                {Object.entries(byOutcome).map(([outcomeId, data]) => {
                  const sorted = data.assessments.sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));
                  const latest = sorted[0];
                  const trend = getProgressTrend(data.assessments);

                  return (
                    <div key={outcomeId} className="rounded-lg p-3 bg-gray-50/80 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <span className="font-mono text-xs font-semibold px-2 py-1 bg-white rounded">
                          {data.outcome.code}
                        </span>
                        <p className="text-sm flex-1 min-w-0">{data.outcome.description}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded font-bold text-sm ${getRatingColor(latest.rating)}`}>
                            {getRatingSymbol(latest.rating)}
                          </span>
                          <span className="text-lg">{getTrendIcon(trend)}</span>
                          <button
                            onClick={() => {
                              setEditingAssessment(latest);
                              setShowAssessmentEditModal(true);
                            }}
                            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit assessment"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setShowHistoryFor(outcomeId)}
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                          >
                            {data.assessments.length} record{data.assessments.length > 1 ? 's' : ''}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!selectedSchool || !selectedTerm) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">Select a school and term to view analytics</p>
        </div>
      );
    }

    // Use term assessments for analytics (all students, all assessments in this term)
    const allAssessments = termAssessments || [];

    // Calculate statistics
    const stats = calculateClassStatistics(allAssessments, students, outcomes);
    const ratingDist = calculateRatingDistribution(allAssessments);

    // Prepare data for charts
    const ratingChartData = [
      { name: 'Easily Meeting', value: ratingDist.EASILY_MEETING, color: '#10b981' },
      { name: 'Meeting', value: ratingDist.MEETING, color: '#3b82f6' },
      { name: 'Needs Practice', value: ratingDist.NEEDS_PRACTICE, color: '#f59e0b' }
    ];

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white shadow-sm rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-600">{students.length}</div>
            <div className="text-xs text-gray-600">Active Students</div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-4">
            <div className="text-3xl font-bold text-green-600">{allAssessments.length}</div>
            <div className="text-xs text-gray-600">Total Assessments</div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-4">
            <div className="text-3xl font-bold text-purple-600">{stats.completionRate?.percentage || 0}%</div>
            <div className="text-xs text-gray-600">Completion Rate</div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-4">
            <div className="text-3xl font-bold text-amber-600">{stats.coverage?.percentage || 0}%</div>
            <div className="text-xs text-gray-600">Curriculum Coverage</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating Distribution Pie Chart */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Assessment Ratings Distribution</h3>
            {allAssessments.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ratingChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ratingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-500">
                No assessment data available
              </div>
            )}
          </div>

          {/* Rating Distribution Bar Chart */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Ratings Breakdown</h3>
            {allAssessments.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ratingChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {ratingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-500">
                No assessment data available
              </div>
            )}
          </div>
        </div>

        {/* Students Needing Attention */}
        {stats.studentsNeedingAttention?.length > 0 && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              Students Needing Attention ({stats.studentsNeedingAttention.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.studentsNeedingAttention.map(student => (
                <div key={student.id} className="border rounded p-3 bg-red-50">
                  <div className="font-medium">{student.firstName} {student.lastName}</div>
                  <div className="text-sm text-gray-600">
                    {student.assessmentCount} assessments
                  </div>
                  <div className="text-sm font-semibold text-red-600">
                    {student.needsPracticePercentage}% Needs Practice
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall Performance Summary */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overall Class Performance</span>
              <span className="font-bold text-xl text-blue-600">{stats.performancePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${stats.performancePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderClassManagement = () => {
    if (!selectedSchool) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">Select a school to manage classes and students</p>
        </div>
      );
    }

    // Note: selectedClassObj is now defined at component level via useMemo
    const classStudents = selectedClassId
      ? students.filter(s => s.classId === selectedClassId)
      : students;

    return (
      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowClassModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <PlusCircle size={18} />
            Create New Class
          </button>
          <button
            onClick={() => setShowAssignStudentModal(true)}
            disabled={!selectedClassId}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus size={18} />
            {selectedClassId ? 'Assign Student to Class' : 'Select a Class First'}
          </button>
          <button
            onClick={() => setShowBulkAssign(true)}
            disabled={!selectedClassId}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={18} />
            {selectedClassId ? 'Bulk Assign Students' : 'Select a Class First'}
          </button>
        </div>

        {/* Classes Overview */}
        <div className="bg-white shadow-sm rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <GraduationCap size={20} />
            My Classes ({classes.length})
          </h3>

          {classes.length === 0 ? (
            <p className="text-gray-500 text-sm">No classes yet. Create your first class to get started!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map(classItem => (
                <div
                  key={classItem.id}
                  className={`p-4 rounded-lg transition-all ${
                    selectedClassId === classItem.id
                      ? 'ring-2 ring-indigo-500 bg-indigo-50 shadow-md'
                      : 'bg-white shadow-sm hover:shadow-md'
                  }`}
                >
                  <button
                    onClick={() => setSelectedClassId(classItem.id === selectedClassId ? '' : classItem.id)}
                    className="w-full text-left"
                  >
                    <div className="font-semibold text-gray-800">{classItem.name}</div>
                    <div className="text-sm text-gray-600">{classItem.gradeLevel}</div>
                    <div className="text-xs text-gray-500 mt-1">{classItem.academicYear}</div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                      <Users size={14} />
                      <span>{classItem._count?.students || 0} students</span>
                    </div>
                  </button>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClass(classItem);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(classItem.id, classItem.name);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Class Students */}
        {selectedClassObj && (
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Users size={20} />
              Students in {selectedClassObj.name} ({classStudents.length})
            </h3>

            {classStudents.length === 0 ? (
              <p className="text-gray-500 text-sm">No students in this class yet. Click "Add Student to Class" above!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {classStudents.map(student => (
                  <div
                    key={student.id}
                    className="p-3 rounded-lg bg-gray-50/80"
                  >
                    <div className="font-medium text-gray-800">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {student.studentIdNumber}
                    </div>
                    {student.dateOfBirth && (
                      <div className="text-xs text-gray-500">
                        DOB: {new Date(student.dateOfBirth).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unassigned Students - Teachers can assign to their classes */}
        {!selectedClassId && students.filter(s => !s.classId).length > 0 && (
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Users size={20} />
              Unassigned Students ({students.filter(s => !s.classId).length})
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              These students are not yet assigned to any class. Use the dropdown on each card to assign them directly, or select a class above for bulk actions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.filter(s => !s.classId).map(student => (
                <div
                  key={student.id}
                  className="p-3 rounded-lg bg-amber-50/80 border border-amber-200"
                >
                  <div className="font-medium text-gray-800">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ID: {student.studentIdNumber}
                  </div>

                  {/* Direct assign dropdown */}
                  {classes.length > 0 ? (
                    <div className="mt-2">
                      <select
                        className="w-full text-xs px-2 py-1.5 border border-amber-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        defaultValue=""
                        disabled={assigningStudentId === student.id}
                        onChange={(e) => {
                          if (e.target.value) {
                            const selectedClass = classes.find(c => c.id === e.target.value);
                            handleDirectAssign(
                              student.id,
                              e.target.value,
                              `${student.firstName} ${student.lastName}`,
                              selectedClass?.name || 'class'
                            );
                            e.target.value = ''; // Reset after selection
                          }
                        }}
                      >
                        <option value="">
                          {assigningStudentId === student.id ? 'Assigning...' : 'Assign to class...'}
                        </option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.gradeLevel})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 mt-2">
                      No classes available
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loadingCountries) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const selectedStudentObj = students.find(s => s.id === selectedStudent);
  const selectedSchoolObj = schools.find(s => s.id === selectedSchool);

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Title Bar / Header */}
      <header className="bg-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-700 rounded text-white"
          >
            <Menu size={20} />
          </button>
          <img
            src="/images/logo.png"
            alt="OECS Logo"
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="font-bold text-sm sm:text-base text-white">OHPC Kindergarten Progress Checklist</h1>
            <p className="text-xs text-slate-300 hidden sm:block">
              {selectedSchoolObj?.name || 'Organisation of Eastern Caribbean States'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-200 bg-slate-700 px-3 py-1.5 rounded">
            <User size={14} />
            <span>{user?.firstName} {user?.lastName}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">{user?.role?.replace('_', ' ')}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded text-xs sm:text-sm transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 bg-white shadow-sm transition-all duration-300 overflow-hidden flex flex-col`}>
          <div className="flex-1 overflow-y-auto">
            {/* Session Controls */}
            <div className="p-4 space-y-3 bg-gray-50/50">
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Session</h3>

              <div>
                <label className="text-xs font-medium text-gray-700">Country</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => { setSelectedCountry(e.target.value); setSelectedSchool(''); }}
                  className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-gray-300"
                >
                  <option value="">
                    {countries.length === 0 ? 'No countries available' : 'Select country...'}
                  </option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">School</label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  disabled={!selectedCountry}
                  className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-gray-300 disabled:opacity-50"
                >
                  <option value="">
                    {!selectedCountry ? 'Select country first' : schools.length === 0 ? 'No schools in country' : 'Select school...'}
                  </option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Calendar size={12} />
                  Term
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  disabled={!selectedSchool}
                  className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-gray-300 disabled:opacity-50"
                >
                  <option value="">
                    {!selectedSchool ? 'Select school first' : terms.length === 0 ? 'No terms configured' : 'Select term...'}
                  </option>
                  {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.schoolYear})</option>)}
                </select>
                {selectedTerm && (
                  <div className="mt-2 px-2 py-1.5 bg-indigo-50 border border-indigo-200 rounded text-xs">
                    <div className="flex items-center gap-1 text-indigo-700">
                      <CheckCircle2 size={12} />
                      <span className="font-medium">Active Term:</span>
                    </div>
                    <div className="text-indigo-900 font-semibold mt-0.5">
                      {terms.find(t => t.id === selectedTerm)?.name}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-gray-300"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Context Info */}
            {currentView === 'data-entry' && (
              <div className="p-4 border-t space-y-3">
                <h3 className="text-xs font-semibold text-gray-600 uppercase">Assessment</h3>

                <div>
                  <label className="text-xs font-medium text-gray-700">Student</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    disabled={!selectedSchool}
                    className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-gray-300 disabled:opacity-50"
                  >
                    <option value="">
                      {!selectedSchool ? 'Select school first' : students.length === 0 ? 'No students enrolled' : `Select student (${students.length})...`}
                    </option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => { setSelectedSubject(e.target.value); setSelectedStrand('all'); }}
                    className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-gray-300"
                  >
                    <option value="">
                      {subjects.length === 0 ? 'No subjects available' : `Select subject (${subjects.length})...`}
                    </option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {currentView === 'learner-reports' && (
              <div className="p-4 border-t space-y-3">
                <h3 className="text-xs font-semibold text-gray-600 uppercase">Student</h3>

                <div>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    disabled={!selectedSchool}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-gray-300 disabled:opacity-50"
                  >
                    <option value="">
                      {!selectedSchool ? 'Select school first' : students.length === 0 ? 'No students enrolled' : `Select student (${students.length})...`}
                    </option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Status Info */}
          {selectedStudentObj && (
            <div className="p-3 bg-blue-50/50 text-xs">
              <div className="flex items-center gap-2 text-blue-900">
                <CheckCircle2 size={16} />
                <span className="font-medium">{selectedStudentObj.firstName} {selectedStudentObj.lastName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content Header */}
          <div className="bg-white shadow-sm px-4 sm:px-6 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
              {navItems.find(n => n.id === currentView)?.label}
            </h2>
            {selectedStudentObj && currentView === 'learner-reports' && (
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            )}
          </div>

          {/* Term Context Banner */}
          {selectedTerm && currentView !== 'class-management' && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 sm:px-6 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-indigo-600" />
                  <span className="text-gray-700">Working in:</span>
                  <span className="font-semibold text-indigo-900">
                    {terms.find(t => t.id === selectedTerm)?.name} ({terms.find(t => t.id === selectedTerm)?.schoolYear})
                  </span>
                </div>
                <div className="text-xs text-gray-600 hidden sm:block">
                  {currentView === 'data-entry' && 'New assessments will be saved to this term'}
                  {currentView === 'learner-reports' && 'Showing assessments from this term only'}
                  {currentView === 'analytics' && 'Analytics calculated for this term only'}
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Welcome guide for new teachers */}
            {showWelcome && currentView === 'data-entry' && (
              <TeacherWelcome
                onDismiss={handleDismissWelcome}
                userName={user?.firstName}
              />
            )}

            {currentView === 'data-entry' && renderDataEntry()}
            {currentView === 'learner-reports' && renderLearnerReports()}
            {currentView === 'reports' && (
              <ReportDashboard
                students={students}
                classes={classes}
                terms={terms}
                subjects={subjects}
                strands={strands}
                outcomes={allOutcomes}
                defaultClassId={selectedClassId}
                defaultTermId={selectedTerm}
              />
            )}
            {currentView === 'analytics' && renderAnalytics()}
            {currentView === 'class-management' && renderClassManagement()}
          </div>
        </div>
      </div>

      {/* Class Setup Modal */}
      <ClassSetupModal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        onSuccess={(newClass) => {
          setSelectedClassId(newClass.id);
          setShowClassModal(false);
        }}
        schoolId={selectedSchool}
      />

      {/* Student Entry Modal */}
      <StudentEntryModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSuccess={() => {
          setShowStudentModal(false);
        }}
        schoolId={selectedSchool}
        classId={selectedClassId}
      />

      {/* Class Edit Modal */}
      <ClassEditModal
        isOpen={showClassEditModal}
        onClose={() => {
          setShowClassEditModal(false);
          setEditingClass(null);
        }}
        onSuccess={() => {
          setShowClassEditModal(false);
          setEditingClass(null);
        }}
        classData={editingClass}
      />

      {/* Student Edit Modal */}
      <StudentEditModal
        isOpen={showStudentEditModal}
        onClose={() => {
          setShowStudentEditModal(false);
          setEditingStudent(null);
        }}
        onSuccess={() => {
          setShowStudentEditModal(false);
          setEditingStudent(null);
        }}
        student={editingStudent}
      />

      {/* Bulk Import Modal - for admins creating new students */}
      <BulkImportStudents
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={() => {
          // Data will auto-refresh via React Query
        }}
        schoolId={selectedSchool}
        classId={selectedClassId}
      />

      {/* Assign Student Modal - for teachers assigning existing students */}
      <AssignStudentModal
        isOpen={showAssignStudentModal}
        onClose={() => setShowAssignStudentModal(false)}
        onSuccess={() => {
          // Data will auto-refresh via React Query
        }}
        classId={selectedClassId}
        className={selectedClassObj?.name || ''}
        students={students}
      />

      {/* Bulk Assign Students Modal - for teachers bulk assigning existing students */}
      <BulkAssignStudents
        isOpen={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        onSuccess={() => {
          // Data will auto-refresh via React Query
        }}
        classId={selectedClassId}
        className={selectedClassObj?.name || ''}
        students={students}
      />

      {/* Assessment History Modal */}
      {showHistoryFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-xl sm:rounded-lg w-full sm:max-w-2xl max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Assessment History</h3>
              <button onClick={() => setShowHistoryFor(null)} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {outcomeHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No history available</p>
              ) : (
                outcomeHistory.map(assessment => (
                  <div key={assessment.id} className="rounded-lg p-3 bg-gray-50/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded font-bold ${getRatingColor(assessment.rating)}`}>
                          {getRatingSymbol(assessment.rating)}
                        </span>
                        <div className="text-sm">
                          <div className="font-medium">{new Date(assessment.assessmentDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{assessment.teacher?.name || 'Unknown'}</div>
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
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assessment Edit Modal */}
      <AssessmentEditModal
        isOpen={showAssessmentEditModal}
        onClose={() => {
          setShowAssessmentEditModal(false);
          setEditingAssessment(null);
        }}
        assessment={editingAssessment}
        onSuccess={() => {
          // Data will auto-refresh via React Query
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title={
          confirmModal.type === 'assessment' ? 'Delete Assessment' :
          confirmModal.type === 'class' ? 'Delete Class' :
          confirmModal.type === 'student' ? 'Remove Student' : 'Confirm Delete'
        }
        message={
          confirmModal.type === 'assessment'
            ? 'Are you sure you want to delete this assessment? This action cannot be undone.'
            : confirmModal.type === 'class'
            ? `Are you sure you want to delete "${confirmModal.data?.name}"? Students in this class will become unassigned.`
            : confirmModal.type === 'student'
            ? `Are you sure you want to remove "${confirmModal.data?.name}"? This will also delete their assessment history.`
            : 'Are you sure you want to proceed?'
        }
        confirmText={
          confirmModal.type === 'student' ? 'Remove Student' : 'Delete'
        }
      />

      {/* Footer */}
      <AppFooter />
    </div>
  );
};

export default DesktopAssessmentApp;
