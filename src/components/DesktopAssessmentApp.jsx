import { useState, useMemo, useEffect } from 'react';
import {
  Download, Search, X, LogOut, Menu, ChevronRight,
  Home, FileText, BarChart3, User, School, Calendar,
  BookOpen, Users, TrendingUp, CheckCircle2, PlusCircle,
  UserPlus, GraduationCap, Edit2, Trash2, Upload, Key,
  Moon, Sun
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
import { useDeleteStudent, useAssignStudentToClass, useUpdateStudent } from '../hooks/useStudents';
import { useCreateTerm } from '../hooks/useTerms';
import ClassSetupModal from './ClassSetupModal';
import StudentEntryModal from './StudentEntryModal';
import ClassEditModal from './ClassEditModal';
import StudentEditModal from './StudentEditModal';
import BulkImportStudents from './BulkImportStudents';
import AssignStudentModal from './AssignStudentModal';
import BulkAssignStudents from './BulkAssignStudents';
import CreateStudentModal from './CreateStudentModal';
import AssessmentEditModal from './AssessmentEditModal';
import TeacherWelcome from './TeacherWelcome';
import ChangePasswordModal from './ChangePasswordModal';
import AppFooter from './AppFooter';
import CommandPalette from './CommandPalette';
import { saveSession, getSession } from '../utils/sessionStorage';
import { offlineQueue } from '../utils/offlineQueue';
import { exportStudentReportPDF } from '../utils/pdfExport';
import { reportsAPI } from '../api/reports';
import { calculateClassStatistics, calculateRatingDistribution, calculateProgressBySubject } from '../utils/analyticsCalculations';
import { ReportDashboard } from './reports';
import { useStrands } from '../hooks/useCurriculum';

// Searchable student picker — used in sidebar when there are more than 5 students
function StudentSearch({ students, value, onChange }) {
  const [query, setQuery] = useState('');
  const filtered = query.trim()
    ? students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase())
      )
    : students;

  const selectedName = value
    ? (() => { const s = students.find(x => x.id === value); return s ? `${s.firstName} ${s.lastName}` : ''; })()
    : '';

  return (
    <div className="mt-1 space-y-1">
      <div className="relative">
        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${students.length} students...`}
          className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="Search students"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => { onChange(e.target.value); setQuery(''); }}
        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        size={Math.min(filtered.length + 1, 6)}
        aria-label="Select student"
      >
        <option value="">{filtered.length === 0 ? 'No matches' : 'Select student...'}</option>
        {filtered.map(s => (
          <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
        ))}
      </select>
      {value && selectedName && (
        <div className="flex items-center justify-between px-2 py-1 bg-indigo-50 border border-indigo-200 rounded text-xs">
          <span className="font-medium text-indigo-900">{selectedName}</span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-indigo-500 hover:text-indigo-700"
            aria-label="Clear student selection"
          >
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

const DesktopAssessmentApp = () => {
  const { user, logout } = useAuth();
  const toast = useToast();

  // UI state — start closed on mobile (< lg breakpoint = 1024px)
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
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
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showAssessmentEditModal, setShowAssessmentEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingAssessment, setEditingAssessment] = useState(null);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCreateTermModal, setShowCreateTermModal] = useState(false);
  const [createTermForm, setCreateTermForm] = useState({ name: '', schoolYear: '', startDate: '', endDate: '' });
  const [createTermError, setCreateTermError] = useState('');

  // Offline queue state
  const [queueCount, setQueueCount] = useState(offlineQueue.count());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track which outcome IDs are currently being saved to prevent double-submit
  const [savingOutcomeIds, setSavingOutcomeIds] = useState(new Set());

  // Brief green highlight after a successful save (assessment card animation)
  const [recentlySavedIds, setRecentlySavedIds] = useState(new Set());

  // Session expiry warning (fires 5 min before JWT expires)
  const [sessionWarning, setSessionWarning] = useState(false);

  // Undo system — pending deletes with 5-second cancel window
  const [undoItems, setUndoItems] = useState([]);

  // Inline student name editing (class management view)
  const [editingStudentInlineId, setEditingStudentInlineId] = useState(null);
  const [editingStudentFirst, setEditingStudentFirst] = useState('');
  const [editingStudentLast, setEditingStudentLast] = useState('');

  // Keyboard shortcut discovery — show hint after 5th mouse click on a rating button
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);

  // Command palette (Cmd+K / Ctrl+K)
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Dark mode — persisted in localStorage, applied to <html> element
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('ohpc_dark_mode') === 'true'
      || (localStorage.getItem('ohpc_dark_mode') === null && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  });

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

  // Draft auto-save — restore banner shown when a saved draft exists
  const [draftBanner, setDraftBanner] = useState(() => {
    try {
      const raw = localStorage.getItem('ohpc_draft_assessments');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // Write draft on every tempAssessments change
  useEffect(() => {
    if (Object.keys(tempAssessments).length > 0) {
      const studentObj = students.find(s => s.id === selectedStudent);
      const studentName = studentObj ? `${studentObj.firstName} ${studentObj.lastName}` : '';
      localStorage.setItem('ohpc_draft_assessments', JSON.stringify({
        classId: selectedClassId,
        studentId: selectedStudent,
        studentName,
        data: tempAssessments,
        savedAt: new Date().toISOString(),
      }));
    }
  }, [tempAssessments]);

  const handleRestoreDraft = () => {
    if (draftBanner?.data) {
      setTempAssessments(draftBanner.data);
    }
    setDraftBanner(null);
  };

  const handleDismissDraft = () => {
    localStorage.removeItem('ohpc_draft_assessments');
    setDraftBanner(null);
    // Also clear in-memory state so the auto-save effect can't immediately re-write the draft
    setTempAssessments({});
    setTempComments({});
  };

  // Flush offline queue when connectivity is restored (or immediately on mount if already online)
  useEffect(() => {
    const MAX_RETRIES = 3;

    const flushQueue = async () => {
      const items = offlineQueue.getAll();
      if (items.length === 0) return;

      let flushed = 0;
      let evicted = 0;
      // Process in reverse so removals don't shift indices
      for (let i = items.length - 1; i >= 0; i--) {
        try {
          const { _queuedAt, _failureCount, ...payload } = items[i];
          await createAssessment.mutateAsync(payload);
          offlineQueue.remove(i);
          flushed++;
        } catch {
          const failures = (items[i]._failureCount || 0) + 1;
          if (failures >= MAX_RETRIES) {
            offlineQueue.remove(i);
            evicted++;
          } else {
            offlineQueue.incrementFailure(i);
          }
        }
      }
      setQueueCount(offlineQueue.count());
      if (flushed > 0) {
        toast.success(`${flushed} queued assessment${flushed !== 1 ? 's' : ''} saved`);
      }
      if (evicted > 0) {
        toast.error(`${evicted} queued assessment${evicted !== 1 ? 's' : ''} could not be saved after ${MAX_RETRIES} attempts and were removed.`);
      }
    };

    // Flush immediately on mount — handles the case where the app is opened
    // already online after being offline (no offline→online transition fires).
    if (navigator.onLine) {
      flushQueue();
    }

    const handleOnline = () => { setIsOnline(true); flushQueue(); };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  // Derived state - students accessible to the current user
  // Teachers can only see students in their assigned classes
  // Admins can see all students
  const accessibleStudents = useMemo(() => {
    if (user?.role === 'TEACHER') {
      // Get IDs of classes taught by this teacher
      const teacherClassIds = classes.map(c => c.id);
      // Filter students to only those in teacher's classes
      return students.filter(s => s.classId && teacherClassIds.includes(s.classId));
    }
    // Admins and other roles can see all students
    return students;
  }, [students, classes, user?.role]);

  // Mutations
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();
  const deleteClass = useDeleteClass();
  const deleteStudent = useDeleteStudent();
  const assignStudentMutation = useAssignStudentToClass();
  const createTerm = useCreateTerm();
  const updateStudentInline = useUpdateStudent();

  // Track which student is being assigned (for loading state)
  const [assigningStudentId, setAssigningStudentId] = useState(null);

  // Restore session on mount — country/school always come from user profile (never from stale session)
  useEffect(() => {
    const savedSession = getSession();
    if (savedSession) {
      if (savedSession.selectedTerm) setSelectedTerm(savedSession.selectedTerm);
      if (savedSession.selectedDate) setSelectedDate(savedSession.selectedDate);
      if (savedSession.selectedSubject) setSelectedSubject(savedSession.selectedSubject);
      if (savedSession.selectedStudent) setSelectedStudent(savedSession.selectedStudent);
      if (savedSession.currentView) setCurrentView(savedSession.currentView);
    }
    // Country and school are always derived from the user's profile assignment
    if (user?.countryId) setSelectedCountry(user.countryId);
    if (user?.schoolId) setSelectedSchool(user.schoolId);
  }, [user?.countryId, user?.schoolId]);

  // After wizard: pre-select the class that was just created
  useEffect(() => {
    const wizardClassId = localStorage.getItem('ohpc_wizard_class_id');
    if (wizardClassId) {
      setSelectedClassId(wizardClassId);
      localStorage.removeItem('ohpc_wizard_class_id');
    }
  }, []);

  // Reset selected student when class changes (prevents stale student from wrong class)
  useEffect(() => {
    setSelectedStudent('');
  }, [selectedClassId]);

  // Session expiry warning — show a banner 5 minutes before the JWT expires
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return;
      const expiresAt = payload.exp * 1000;
      const msLeft = expiresAt - Date.now();
      const warnMs = 5 * 60 * 1000;
      if (msLeft <= 0) return;
      if (msLeft <= warnMs) { setSessionWarning(true); return; }
      const timerId = setTimeout(() => setSessionWarning(true), msLeft - warnMs);
      return () => clearTimeout(timerId);
    } catch { /* ignore malformed token */ }
  }, [user]);

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
      selectedTerm,
      selectedDate,
      selectedSubject,
      selectedStudent,
      currentView
    });
  }, [selectedTerm, selectedDate, selectedSubject, selectedStudent, currentView]);

  // Update document title per view
  useEffect(() => {
    const titles = {
      'data-entry': 'Assessment Entry',
      'learner-reports': 'Student Reports',
      'reports': 'Reports',
      'analytics': 'Analytics',
      'class-management': 'Class Management',
    };
    document.title = `${titles[currentView] || 'App'} — OHPC Kindergarten`;
    return () => { document.title = 'OHPC Kindergarten Progress Checklist'; };
  }, [currentView]);

  // Dark mode — apply/remove class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('ohpc_dark_mode', darkMode);
  }, [darkMode]);

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

    // Prevent double-submit for the same outcome
    if (savingOutcomeIds.has(outcome.id)) return;
    setSavingOutcomeIds(prev => new Set(prev).add(outcome.id));

    const payload = {
      studentId: selectedStudent,
      learningOutcomeId: outcome.id,
      termId: selectedTerm,
      assessmentDate: selectedDate,
      rating: rating,
      comment,
    };

    try {
      await createAssessment.mutateAsync(payload);

      const newTemp = { ...tempAssessments };
      delete newTemp[outcome.id];
      setTempAssessments(newTemp);
      // Clear the draft once all pending assessments have been saved
      if (Object.keys(newTemp).length === 0) {
        localStorage.removeItem('ohpc_draft_assessments');
        setDraftBanner(null);
      }

      const newComments = { ...tempComments };
      delete newComments[outcome.id];
      setTempComments(newComments);

      // Trigger save animation on the card
      setRecentlySavedIds(prev => new Set(prev).add(outcome.id));
      setTimeout(() => setRecentlySavedIds(prev => { const next = new Set(prev); next.delete(outcome.id); return next; }), 1500);

      toast.success('Assessment saved successfully');
    } catch (error) {
      // If offline, queue for later sync instead of showing an error
      if (!navigator.onLine) {
        const count = offlineQueue.add(payload);
        setQueueCount(count);

        const newTemp = { ...tempAssessments };
        delete newTemp[outcome.id];
        setTempAssessments(newTemp);
        const newComments = { ...tempComments };
        delete newComments[outcome.id];
        setTempComments(newComments);

        toast.warning(`Offline — assessment queued (${count} pending). Will sync when reconnected.`);
      } else {
        toast.error('Failed to save assessment: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setSavingOutcomeIds(prev => { const next = new Set(prev); next.delete(outcome.id); return next; });
    }
  };

  // Global Cmd+K / Ctrl+K listener for command palette
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

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

  // Schedule a delete with a 5-second undo window
  const scheduleDelete = (type, data, label) => {
    const itemId = `del_${Date.now()}_${Math.random()}`;
    const timeoutId = setTimeout(async () => {
      setUndoItems(prev => prev.filter(i => i.id !== itemId));
      try {
        if (type === 'assessment') {
          await deleteAssessment.mutateAsync(data.id);
        } else if (type === 'class') {
          await deleteClass.mutateAsync(data.id);
          if (selectedClassId === data.id) setSelectedClassId('');
        } else if (type === 'student') {
          await deleteStudent.mutateAsync(data.id);
        }
      } catch (err) {
        toast.error(`Failed to delete: ` + (err.message || 'Unknown error'));
      }
    }, 5000);
    setUndoItems(prev => [...prev, { id: itemId, type, data, label, timeoutId }]);
  };

  const handleUndoDelete = (itemId) => {
    setUndoItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (item) clearTimeout(item.timeoutId);
      return prev.filter(i => i.id !== itemId);
    });
  };

  const handleDeleteAssessment = (assessment) => {
    const id = typeof assessment === 'string' ? assessment : assessment.id;
    const date = typeof assessment === 'object' && assessment.assessmentDate
      ? new Date(assessment.assessmentDate).toLocaleDateString()
      : null;
    scheduleDelete('assessment', { id }, `Assessment${date ? ` from ${date}` : ''}`);
  };

  const handleDeleteClass = (classId, className) => {
    scheduleDelete('class', { id: classId }, `Class "${className}"`);
  };

  const handleDeleteStudent = (studentId, studentName) => {
    scheduleDelete('student', { id: studentId }, `Student "${studentName}"`);
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

  const handleSaveInlineStudent = async (student) => {
    if (!editingStudentFirst.trim() || !editingStudentLast.trim()) return;
    try {
      await updateStudentInline.mutateAsync({
        id: student.id,
        data: {
          firstName: editingStudentFirst.trim(),
          lastName: editingStudentLast.trim(),
          dateOfBirth: student.dateOfBirth || null,
          studentIdNumber: student.studentIdNumber,
          classId: student.classId || null,
          isActive: student.isActive !== false,
        },
      });
      setEditingStudentInlineId(null);
      toast.success('Student name updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update student');
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

  // Parent report download state
  const [downloadingParentReport, setDownloadingParentReport] = useState(false);

  // Server-side parent report PDF (polished, formatted for sharing with parents)
  const handleDownloadParentReport = async () => {
    if (!selectedStudent) {
      toast.warning('Please select a student first');
      return;
    }
    if (!selectedTerm) {
      toast.warning('Please select a term first');
      return;
    }
    setDownloadingParentReport(true);
    try {
      const studentObj = students.find(s => s.id === selectedStudent);
      await reportsAPI.downloadReport(
        'student',
        'pdf',
        { studentId: selectedStudent, termId: selectedTerm },
        { studentName: studentObj ? `${studentObj.firstName} ${studentObj.lastName}` : '' }
      );
    } catch (err) {
      toast.error(err.message || 'Failed to generate parent report');
    } finally {
      setDownloadingParentReport(false);
    }
  };

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
      // If the class has no students yet, show a helpful empty state with instructions
      if (students.length === 0) {
        return (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center max-w-sm">
              <Users className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-700 font-medium">No students in this class yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Head to <strong>Class Management</strong> to add students to your class.
              </p>
              <button
                onClick={() => setCurrentView('class-management')}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
              >
                Go to Class Management
              </button>
            </div>
          </div>
        );
      }

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

        {/* Rating scale legend — always visible */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
          <span className="font-medium text-gray-600 shrink-0">Rating guide:</span>
          <span className="flex items-center gap-1.5 text-gray-600">
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-bold text-green-700 font-mono">+</kbd>
            Easily Meeting
          </span>
          <span className="flex items-center gap-1.5 text-gray-600">
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-bold text-blue-700 font-mono">=</kbd>
            Meeting
          </span>
          <span className="flex items-center gap-1.5 text-gray-600">
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-bold text-red-600 font-mono">x</kbd>
            Needs Practice
          </span>
        </div>

        {/* One-time keyboard shortcut discovery banner (shown after 5 mouse clicks) */}
        {showKeyboardHint && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-sm" role="note">
            <div className="flex items-center gap-2 text-indigo-800 flex-wrap">
              <span className="font-medium">Pro tip:</span>
              <span>Click a card then use</span>
              <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">+</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">=</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">x</kbd>
              <span>to rate without clicking, then</span>
              <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">Enter</kbd>
              <span>to save.</span>
            </div>
            <button
              onClick={() => setShowKeyboardHint(false)}
              className="ml-3 text-indigo-400 hover:text-indigo-700 flex-shrink-0"
              aria-label="Dismiss tip"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Keyboard shortcut hint — shown while an outcome card is focused */}
        {focusedOutcomeId && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 text-sm text-indigo-800 flex items-center gap-4 flex-wrap">
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
            const justSaved = recentlySavedIds.has(outcome.id);

            return (
              <div
                key={outcome.id}
                onClick={() => setFocusedOutcomeId(outcome.id)}
                onFocus={() => setFocusedOutcomeId(outcome.id)}
                tabIndex={0}
                className={`rounded-lg p-3 transition-all cursor-pointer ${
                  justSaved
                    ? 'bg-green-50 ring-2 ring-green-400 shadow-md'
                    : isFocused
                    ? 'bg-white ring-2 ring-indigo-500 shadow-lg'
                    : 'bg-white shadow-sm hover:shadow-md'
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

                  {/* Assessment controls — sticky at bottom on tablet when card is focused */}
                  <div className={`flex-shrink-0 space-y-2 lg:w-64 ${
                    isFocused ? 'lg:static sticky bottom-0 bg-white pt-2 pb-1 -mx-3 px-3 border-t border-gray-100 lg:border-t-0 lg:bg-transparent lg:pt-0 lg:pb-0 lg:mx-0 lg:px-0 z-10' : ''
                  }`}>
                    <div className="flex gap-2">
                      {[
                        { symbol: '+', key: '1', rating: 'EASILY_MEETING', label: 'Easily Meeting' },
                        { symbol: '=', key: '2', rating: 'MEETING', label: 'Meeting' },
                        { symbol: 'x', key: '3', rating: 'NEEDS_PRACTICE', label: 'Needs Practice' }
                      ].map(({ symbol, key, rating, label }) => (
                        <button
                          key={symbol}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempAssessments({...tempAssessments, [outcome.id]: rating});
                            // Keyboard shortcut discovery — show hint after 5th mouse click
                            if (!localStorage.getItem('ohpc_keyboard_hint_shown')) {
                              const count = parseInt(localStorage.getItem('ohpc_rating_clicks') || '0') + 1;
                              localStorage.setItem('ohpc_rating_clicks', count);
                              if (count >= 5) {
                                localStorage.setItem('ohpc_keyboard_hint_shown', 'true');
                                setShowKeyboardHint(true);
                              }
                            }
                          }}
                          aria-label={`${label}${currentRating === rating ? ' (selected)' : ''}`}
                          aria-pressed={currentRating === rating}
                          className={`flex-1 h-11 lg:h-10 rounded font-bold text-lg lg:text-base transition-all relative ${
                            currentRating === rating
                              ? symbol === '+' ? 'bg-green-500 text-white ring-2 ring-green-600'
                                : symbol === '=' ? 'bg-blue-500 text-white ring-2 ring-blue-600'
                                : 'bg-amber-500 text-white ring-2 ring-amber-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={`${label} — key ${key} or ${symbol}`}
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
                      disabled={!currentRating || savingOutcomeIds.has(outcome.id)}
                      className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {savingOutcomeIds.has(outcome.id) ? 'Saving...' : (isFocused ? 'Save (Enter)' : 'Save')}
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
        {/* Action Toolbar */}
        <div className="space-y-2">
          {/* Primary actions — always visible */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowClassModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              <PlusCircle size={18} />
              Create New Class
            </button>
            <button
              onClick={() => setShowCreateStudentModal(true)}
              disabled={!selectedClassId}
              className="flex items-center gap-2 px-4 py-2 bg-[#558B2F] text-white rounded-md hover:bg-[#43731F] focus:outline-none focus:ring-2 focus:ring-[#558B2F] disabled:opacity-40 disabled:cursor-not-allowed"
              title={!selectedClassId ? 'Select a class above to add a student' : `Add a new student to ${selectedClassObj?.name}`}
            >
              <UserPlus size={18} />
              Add Student
            </button>
          </div>

          {/* Secondary actions — only shown when a class is selected */}
          {selectedClassObj && (
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2">
              <span className="text-xs text-gray-500 mr-1">
                More for <span className="font-semibold text-indigo-700">{selectedClassObj.name}</span>:
              </span>
              <button
                onClick={() => setShowBulkImport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                title={`Bulk import students from CSV into ${selectedClassObj.name}`}
              >
                <Upload size={15} />
                Bulk Import CSV
              </button>
              <button
                onClick={() => setShowAssignStudentModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                title={`Move an existing student into ${selectedClassObj.name}`}
              >
                <Users size={15} />
                Move Student Here
              </button>
              <button
                onClick={() => setShowBulkAssign(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                title={`Bulk assign students to ${selectedClassObj.name}`}
              >
                <Users size={15} />
                Bulk Assign
              </button>
            </div>
          )}
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
                      disabled={(classItem._count?.students || 0) > 0}
                      title={(classItem._count?.students || 0) > 0 ? `Cannot delete — ${classItem._count.students} student${classItem._count.students !== 1 ? 's' : ''} enrolled. Remove students first.` : 'Delete class'}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-50"
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
                    {editingStudentInlineId === student.id ? (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          <input
                            autoFocus
                            type="text"
                            value={editingStudentFirst}
                            onChange={(e) => setEditingStudentFirst(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineStudent(student);
                              if (e.key === 'Escape') setEditingStudentInlineId(null);
                            }}
                            placeholder="First name"
                            className="flex-1 min-w-0 px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                          />
                          <input
                            type="text"
                            value={editingStudentLast}
                            onChange={(e) => setEditingStudentLast(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineStudent(student);
                              if (e.key === 'Escape') setEditingStudentInlineId(null);
                            }}
                            placeholder="Last name"
                            className="flex-1 min-w-0 px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                          />
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSaveInlineStudent(student)}
                            disabled={updateStudentInline.isPending}
                            className="flex-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {updateStudentInline.isPending ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingStudentInlineId(null)}
                            className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          className="font-medium text-gray-800 hover:text-indigo-700 text-left w-full group flex items-center gap-1"
                          title="Click to edit name"
                          onClick={() => {
                            setEditingStudentInlineId(student.id);
                            setEditingStudentFirst(student.firstName);
                            setEditingStudentLast(student.lastName);
                          }}
                        >
                          {student.firstName} {student.lastName}
                          <Edit2 size={11} className="opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
                        </button>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {student.studentIdNumber}
                        </div>
                        {student.dateOfBirth && (
                          <div className="text-xs text-gray-500">
                            DOB: {new Date(student.dateOfBirth).toLocaleDateString()}
                          </div>
                        )}
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            title="Edit all student details"
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unassigned Students - always visible so teachers can always assign them */}
        {students.filter(s => !s.classId).length > 0 && (
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
                        className="w-full text-xs px-2 py-1.5 border border-amber-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] disabled:opacity-50"
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
          {/* Offline indicator */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full font-medium" title="You are offline — assessments will be queued">
              <span className="w-2 h-2 bg-white rounded-full opacity-80 animate-pulse" />
              Offline
              {queueCount > 0 && <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full">{queueCount} queued</span>}
            </div>
          )}
          {/* Queue flush badge — shown when online but unsent items exist */}
          {isOnline && queueCount > 0 && (
            <div className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full font-medium" title="Syncing queued assessments…">
              <span className="w-2 h-2 bg-white rounded-full opacity-80 animate-ping" />
              {queueCount} syncing
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-200 bg-slate-700 px-3 py-1.5 rounded">
            <User size={14} />
            <span>{user?.firstName} {user?.lastName}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">{user?.role?.replace('_', ' ')}</span>
          </div>
          <button
            onClick={() => setDarkMode(d => !d)}
            className="flex items-center px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setShowCommandPalette(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded text-xs transition-colors"
            title="Open command palette (Cmd+K)"
          >
            <Search size={14} />
            <span className="text-slate-400">⌘K</span>
          </button>
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded text-xs sm:text-sm transition-colors"
            title="Change Password"
          >
            <Key size={16} />
            <span className="hidden sm:inline">Password</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded text-xs sm:text-sm transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Offline mode banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 flex items-center gap-2 text-sm text-amber-800" role="alert">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0" />
          <span>
            <span className="font-medium">You're offline.</span>{' '}
            Assessments you save will be queued and synced automatically when reconnected.
            {queueCount > 0 && <span className="ml-1 font-medium">({queueCount} pending)</span>}
          </span>
        </div>
      )}

      {/* Session expiry warning banner */}
      {sessionWarning && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 flex items-center justify-between text-sm z-40" role="alert">
          <div className="flex items-center gap-2 text-amber-800">
            <Calendar size={15} className="flex-shrink-0" />
            <span>Your session expires soon. Save your work — you'll be signed out automatically.</span>
          </div>
          <button
            onClick={() => setSessionWarning(false)}
            className="ml-4 text-amber-600 hover:text-amber-800 flex-shrink-0"
            aria-label="Dismiss session warning"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 bg-white shadow-sm transition-all duration-300 overflow-hidden flex flex-col`}>
          <div className="flex-1 overflow-y-auto">
            {/* Session Controls */}
            <div className="p-4 space-y-3 bg-gray-50/50">
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Session</h3>

              <div>
                <label className="text-xs font-medium text-gray-700">Country</label>
                <p className="mt-1 px-2 py-1.5 bg-gray-100 border border-gray-200 rounded text-sm text-gray-800 truncate">
                  {user?.countryName || '—'}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">School</label>
                <p className="mt-1 px-2 py-1.5 bg-gray-100 border border-gray-200 rounded text-sm text-gray-800 truncate">
                  {user?.schoolName || '—'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <Calendar size={12} />
                    Term
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCreateTermModal(true)}
                    className="flex items-center gap-0.5 text-xs text-[#1E3A5F] hover:text-[#2D4A6F] font-medium"
                    title="Create new term"
                  >
                    <PlusCircle size={13} />
                    New
                  </button>
                </div>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-gray-300"
                >
                  <option value="">
                    {terms.length === 0 ? 'No terms configured' : 'Select term...'}
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
                  {accessibleStudents.length > 5 && selectedSchool ? (
                    <StudentSearch
                      students={accessibleStudents}
                      value={selectedStudent}
                      onChange={setSelectedStudent}
                    />
                  ) : (
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      disabled={!selectedSchool}
                      className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-gray-300 disabled:opacity-50"
                    >
                      <option value="">
                        {!selectedSchool ? 'Select school first' : accessibleStudents.length === 0 ? (user?.role === 'TEACHER' ? 'No students in your classes' : 'No students enrolled') : `Select student (${accessibleStudents.length})...`}
                      </option>
                      {accessibleStudents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                    </select>
                  )}
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
                  {accessibleStudents.length > 5 && selectedSchool ? (
                    <StudentSearch
                      students={accessibleStudents}
                      value={selectedStudent}
                      onChange={setSelectedStudent}
                    />
                  ) : (
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      disabled={!selectedSchool}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-gray-300 disabled:opacity-50"
                    >
                      <option value="">
                        {!selectedSchool ? 'Select school first' : accessibleStudents.length === 0 ? (user?.role === 'TEACHER' ? 'No students in your classes' : 'No students enrolled') : `Select student (${accessibleStudents.length})...`}
                      </option>
                      {accessibleStudents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                    </select>
                  )}
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
            <div>
              <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
                {navItems.find(n => n.id === currentView)?.label}
              </h2>
              {/* Context breadcrumb */}
              {(selectedTerm || selectedClassObj || selectedStudentObj) && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 flex-wrap">
                  {selectedTerm && (
                    <span className="text-indigo-700 font-medium">
                      {terms.find(t => t.id === selectedTerm)?.name}
                    </span>
                  )}
                  {selectedClassObj && (
                    <>
                      <ChevronRight size={12} className="text-gray-400" />
                      <span className="text-gray-600">{selectedClassObj.name}</span>
                    </>
                  )}
                  {selectedStudentObj && (
                    <>
                      <ChevronRight size={12} className="text-gray-400" />
                      <span className="font-medium text-gray-700">{selectedStudentObj.firstName} {selectedStudentObj.lastName}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            {selectedStudentObj && currentView === 'learner-reports' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadParentReport}
                  disabled={downloadingParentReport}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#558B2F] text-white rounded text-xs sm:text-sm hover:bg-[#43731F] disabled:opacity-50"
                  title="Download a formatted PDF report to share with parents"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">
                    {downloadingParentReport ? 'Generating...' : 'Parent Report'}
                  </span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
              </div>
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
            {/* No active term warning */}
            {selectedSchool && terms.length === 0 && currentView !== 'class-management' && (
              <div className="mb-4 flex items-start justify-between gap-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium text-sm">No academic term configured</p>
                    <p className="text-amber-700 text-xs mt-0.5">
                      Create a term to start recording assessments.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateTermModal(true)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded hover:bg-amber-700 transition-colors"
                >
                  <PlusCircle size={14} />
                  Create Term
                </button>
              </div>
            )}

            {/* No classes assigned — teacher-specific guidance */}
            {user?.role === 'TEACHER' && selectedSchool && classes.length === 0 && currentView === 'data-entry' && (
              <div className="mb-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <Users size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium text-sm">No classes yet</p>
                  <p className="text-blue-700 text-xs mt-0.5">
                    Go to <strong>Manage Classes</strong> to create your first class and add students.
                  </p>
                </div>
              </div>
            )}

            {/* Draft restore banner — shown when unsaved assessments from a previous session exist */}
            {draftBanner && currentView === 'data-entry' && (
              <div className="mb-3 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Unsaved assessments</span>
                  {draftBanner.studentName ? <> for <span className="font-medium">{draftBanner.studentName}</span></> : ''}
                  {draftBanner.savedAt ? <> from {new Date(draftBanner.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                    {new Date(draftBanner.savedAt).toDateString() === new Date().toDateString() ? 'today' : `on ${new Date(draftBanner.savedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}</> : ' from a previous session'}.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleRestoreDraft}
                    className="text-sm font-medium text-amber-900 underline hover:text-amber-700"
                  >
                    Restore
                  </button>
                  <button
                    onClick={handleDismissDraft}
                    className="text-sm text-amber-600 hover:text-amber-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Welcome guide — shown once class and term are ready */}
            {showWelcome && currentView === 'data-entry' && classes.length > 0 && terms.length > 0 && (
              <TeacherWelcome
                onDismiss={handleDismissWelcome}
                userName={user?.firstName}
              />
            )}

            {currentView === 'data-entry' && renderDataEntry()}
            {currentView === 'learner-reports' && renderLearnerReports()}
            {currentView === 'reports' && (
              <ReportDashboard
                students={accessibleStudents}
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

      {/* Create Student Modal - teachers add brand-new students to their class */}
      <CreateStudentModal
        isOpen={showCreateStudentModal}
        onClose={() => setShowCreateStudentModal(false)}
        onSuccess={() => {
          // Data will auto-refresh via React Query
        }}
        classId={selectedClassId}
        className={selectedClassObj?.name || ''}
      />

      {/* Assign Student Modal - for moving existing unassigned students into a class */}
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-modal-title"
        >
          <div className="bg-white rounded-t-xl sm:rounded-lg w-full sm:max-w-2xl max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 id="history-modal-title" className="font-bold text-lg">Assessment History</h3>
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
                        onClick={() => handleDeleteAssessment(assessment)}
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

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        students={accessibleStudents}
        classes={classes}
        subjects={subjects}
        onNavigate={(view) => setCurrentView(view)}
        onSelectStudent={(id) => setSelectedStudent(id)}
        onSelectSubject={(id) => setSelectedSubject(id)}
      />

      {/* Undo bar — appears at bottom when deletions are pending */}
      {undoItems.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4 z-50"
          role="status"
          aria-live="polite"
          style={{ minWidth: '280px', maxWidth: '480px' }}
        >
          <div className="flex-1 text-sm">
            {undoItems.length === 1
              ? <span><span className="font-medium">{undoItems[0].label}</span> will be deleted</span>
              : <span><span className="font-medium">{undoItems.length} items</span> will be deleted</span>
            }
          </div>
          <button
            onClick={() => handleUndoDelete(undoItems[undoItems.length - 1].id)}
            className="text-sm bg-white text-gray-900 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100 flex-shrink-0"
          >
            Undo
          </button>
          {undoItems.length > 1 && (
            <button
              onClick={() => {
                undoItems.forEach(i => clearTimeout(i.timeoutId));
                setUndoItems([]);
              }}
              className="text-gray-400 hover:text-white flex-shrink-0"
              aria-label="Dismiss all"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <AppFooter />

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* Create Term Modal */}
      {showCreateTermModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-term-modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 id="create-term-modal-title" className="text-lg font-bold text-gray-800">Create Academic Term</h2>
                <p className="text-sm text-gray-500">{user?.schoolName}</p>
              </div>
              <button onClick={() => { setShowCreateTermModal(false); setCreateTermError(''); setCreateTermForm({ name: '', schoolYear: '', startDate: '', endDate: '' }); }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setCreateTermError('');
                const { name, schoolYear, startDate, endDate } = createTermForm;
                if (!name.trim() || !schoolYear.trim() || !startDate || !endDate) {
                  setCreateTermError('All fields are required.');
                  return;
                }
                if (new Date(endDate) <= new Date(startDate)) {
                  setCreateTermError('End date must be after start date.');
                  return;
                }
                try {
                  await createTerm.mutateAsync({ name: name.trim(), schoolYear: schoolYear.trim(), startDate, endDate });
                  toast.success(`${name.trim()} created successfully`);
                  setShowCreateTermModal(false);
                  setCreateTermForm({ name: '', schoolYear: '', startDate: '', endDate: '' });
                } catch (err) {
                  setCreateTermError(err.message || 'Failed to create term. Please try again.');
                }
              }}
              className="p-4 space-y-4"
            >
              {createTermError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{createTermError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={createTermForm.name}
                    onChange={(e) => setCreateTermForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Term 1"
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Year <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={createTermForm.schoolYear}
                    onChange={(e) => setCreateTermForm(prev => ({ ...prev, schoolYear: e.target.value }))}
                    placeholder="e.g. 2025-2026"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={createTermForm.startDate}
                    onChange={(e) => setCreateTermForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={createTermForm.endDate}
                    onChange={(e) => setCreateTermForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateTermModal(false); setCreateTermError(''); setCreateTermForm({ name: '', schoolYear: '', startDate: '', endDate: '' }); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTerm.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Calendar size={16} />
                  {createTerm.isPending ? 'Creating...' : 'Create Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopAssessmentApp;
