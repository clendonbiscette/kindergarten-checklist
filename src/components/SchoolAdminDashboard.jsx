import { useState, useEffect } from 'react';
import {
  School, Users, GraduationCap, BookOpen, LogOut, Edit2,
  Save, X, Phone, Mail, MapPin, Calendar, RefreshCw, Plus,
  UserPlus, Search, BarChart3, Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import apiClient from '../api/client';
import { useClasses, useDeleteClass } from '../hooks/useClasses';
import { useStudents, useDeleteStudent } from '../hooks/useStudents';
import { useTerms, useCreateTerm, useUpdateTerm, useDeleteTerm } from '../hooks/useTerms';
import ClassSetupModal from './ClassSetupModal';
import ClassEditModal from './ClassEditModal';
import StudentEntryModal from './StudentEntryModal';
import StudentEditModal from './StudentEditModal';
import BulkImportStudents from './BulkImportStudents';
import ConfirmModal from './ConfirmModal';
import AppFooter from './AppFooter';
import { ReportDashboard } from './reports';
import { useStrands, useLearningOutcomes, useSubjects } from '../hooks/useCurriculum';

const TABS = [
  { id: 'overview', label: 'Overview', icon: School },
  { id: 'classes', label: 'Classes', icon: GraduationCap },
  { id: 'students', label: 'Students', icon: BookOpen },
  { id: 'terms', label: 'Terms', icon: Calendar },
  { id: 'teachers', label: 'Teachers', icon: Users },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

const SchoolAdminDashboard = ({ schoolData: initialSchoolData }) => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [schoolData, setSchoolData] = useState(initialSchoolData);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showClassModal, setShowClassModal] = useState(false);
  const [showClassEditModal, setShowClassEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showStudentEditModal, setShowStudentEditModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);

  // Confirm modal states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, data: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Search/filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  // Data hooks
  const { data: classes = [], isLoading: classesLoading, refetch: refetchClasses } = useClasses(
    schoolData?.id ? { schoolId: schoolData.id } : {}
  );
  const { data: students = [], isLoading: studentsLoading, refetch: refetchStudents } = useStudents(
    schoolData?.id ? { schoolId: schoolData.id } : {}
  );
  const { data: terms = [], isLoading: termsLoading, refetch: refetchTerms } = useTerms(schoolData?.id);

  // Curriculum data for reports
  const { data: subjects = [] } = useSubjects();
  const { data: strands = [] } = useStrands();
  const { data: outcomes = [] } = useLearningOutcomes({});

  // Mutations
  const deleteClass = useDeleteClass();
  const deleteStudent = useDeleteStudent();
  const deleteTerm = useDeleteTerm();

  useEffect(() => {
    if (schoolData) {
      setEditForm({
        name: schoolData.name || '',
        address: schoolData.address || '',
        phone: schoolData.phone || '',
        email: schoolData.email || '',
      });
    }
  }, [schoolData]);

  const refreshSchoolData = async () => {
    try {
      const response = await apiClient.get('/schools/my-school');
      if (response.success && response.data) {
        setSchoolData(response.data);
      }
    } catch (err) {
      console.error('Failed to refresh school data:', err);
    }
  };

  const handleSaveEdit = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await apiClient.put('/schools/my-school', editForm);
      if (response.success) {
        setSchoolData(response.data);
        setIsEditing(false);
        toast.success('School information updated successfully');
      } else {
        setError(response.message || 'Failed to update school');
      }
    } catch (err) {
      setError(err.message || 'Failed to update school');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: schoolData.name || '',
      address: schoolData.address || '',
      phone: schoolData.phone || '',
      email: schoolData.email || '',
    });
    setIsEditing(false);
    setError('');
  };

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
      if (type === 'class') {
        await deleteClass.mutateAsync(data.id);
        refetchClasses();
        toast.success(`Class "${data.name}" deleted successfully`);
      } else if (type === 'student') {
        await deleteStudent.mutateAsync(data.id);
        refetchStudents();
        toast.success(`Student "${data.name}" removed successfully`);
      } else if (type === 'term') {
        await deleteTerm.mutateAsync(data.id);
        refetchTerms();
        toast.success(`Term "${data.name}" deleted successfully`);
      }
      closeDeleteConfirm();
    } catch (err) {
      toast.error(err.message || `Failed to delete ${type}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClass = (classId, className) => {
    openDeleteConfirm('class', { id: classId, name: className });
  };

  const handleDeleteStudent = (studentId, studentName) => {
    openDeleteConfirm('student', { id: studentId, name: studentName });
  };

  const handleDeleteTerm = (termId, termName) => {
    openDeleteConfirm('term', { id: termId, name: termName });
  };

  // Filter students based on search and class filter
  const filteredStudents = students.filter(student => {
    const matchesSearch = studentSearch === '' ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.studentIdNumber?.toLowerCase().includes(studentSearch.toLowerCase());

    const matchesClass = classFilter === 'all' ||
      (classFilter === 'unassigned' && !student.classId) ||
      student.classId === classFilter;

    return matchesSearch && matchesClass;
  });

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'classes':
        return renderClasses();
      case 'students':
        return renderStudents();
      case 'terms':
        return renderTerms();
      case 'teachers':
        return renderTeachers();
      case 'reports':
        return renderReports();
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* School Info Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <School size={20} />
            School Information
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshSchoolData}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Refresh data"
            >
              <RefreshCw size={18} />
            </button>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                <Edit2 size={16} />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-gray-50 hover:bg-gray-100"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  <Save size={16} />
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{schoolData?.name}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{schoolData?.address || 'No address provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <span>{schoolData?.phone || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <span>{schoolData?.email || 'No email provided'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center md:justify-end">
                <div className="text-center bg-blue-50 rounded-lg px-6 py-4">
                  <div className="text-sm text-blue-600 mb-1">Country</div>
                  <div className="text-lg font-semibold text-blue-800">
                    {schoolData?.country?.name}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab('teachers')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users size={24} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {schoolData?.teachers?.length || 0}
              </div>
              <div className="text-xs text-gray-500">Teachers</div>
            </div>
          </div>
        </div>
        <div
          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab('classes')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GraduationCap size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {classes.length}
              </div>
              <div className="text-xs text-gray-500">Classes</div>
            </div>
          </div>
        </div>
        <div
          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab('students')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen size={24} className="text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {students.length}
              </div>
              <div className="text-xs text-gray-500">Students</div>
            </div>
          </div>
        </div>
        <div
          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab('terms')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar size={24} className="text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {terms.length}
              </div>
              <div className="text-xs text-gray-500">Terms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowClassModal(true)}
            className="flex items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus size={20} />
            <span>New Class</span>
          </button>
          <button
            onClick={() => setShowStudentModal(true)}
            className="flex items-center justify-center gap-2 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <UserPlus size={20} />
            <span>Add Student</span>
          </button>
          <button
            onClick={() => setShowTermModal(true)}
            className="flex items-center justify-center gap-2 p-4 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <Calendar size={20} />
            <span>New Term</span>
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className="flex items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Users size={20} />
            <span>View Teachers</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Classes</h2>
        <button
          onClick={() => setShowClassModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Class
        </button>
      </div>

      {classesLoading ? (
        <div className="text-center py-8 text-gray-500">Loading classes...</div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-medium text-gray-700 mb-2">No Classes Yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first class to start organizing students.
          </p>
          <button
            onClick={() => setShowClassModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create First Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem) => (
            <div key={classItem.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{classItem.name}</h3>
                    <p className="text-sm text-gray-500">{classItem.gradeLevel}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {classItem.academicYear}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <BookOpen size={14} />
                    <span>{classItem._count?.students || 0} students</span>
                  </div>
                </div>
                {classItem.teacher && (
                  <div className="mt-2 text-sm text-gray-500">
                    Teacher: {classItem.teacher.firstName} {classItem.teacher.lastName}
                  </div>
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedClass(classItem);
                    setShowClassEditModal(true);
                  }}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClass(classItem.id, classItem.name)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800">Students</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Upload size={18} />
            Bulk Import
          </button>
          <button
            onClick={() => setShowStudentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <UserPlus size={18} />
            Add Student
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:border-blue-400 focus:outline-none"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-md focus:border-blue-400 focus:outline-none bg-white"
        >
          <option value="all">All Classes</option>
          <option value="unassigned">Unassigned</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {studentsLoading ? (
        <div className="text-center py-8 text-gray-500">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-medium text-gray-700 mb-2">No Students Yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add your first student to start tracking assessments.
          </p>
          <button
            onClick={() => setShowStudentModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Add First Student
          </button>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-2">
            Showing {filteredStudents.length} of {students.length} students
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 hidden sm:table-cell">Student ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 hidden md:table-cell">Class</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-gray-500 sm:hidden">
                        {student.studentIdNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                      {student.studentIdNumber}
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">
                      {student.class ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {student.class.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowStudentEditModal(true);
                        }}
                        className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                        className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded ml-1"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  const renderTerms = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Academic Terms</h2>
        <button
          onClick={() => {
            setEditingTerm(null);
            setShowTermModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
        >
          <Plus size={18} />
          Create Term
        </button>
      </div>

      {termsLoading ? (
        <div className="text-center py-8 text-gray-500">Loading terms...</div>
      ) : terms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-medium text-gray-700 mb-2">No Terms Yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create academic terms to organize assessments by period.
          </p>
          <button
            onClick={() => setShowTermModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Create First Term
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {terms.map((term) => (
            <div key={term.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{term.name}</h3>
                    <p className="text-sm text-gray-500">{term.schoolYear}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <div>Start: {new Date(term.startDate).toLocaleDateString()}</div>
                  <div>End: {new Date(term.endDate).toLocaleDateString()}</div>
                </div>
                {term._count?.assessments > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {term._count.assessments} assessments
                  </div>
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingTerm(term);
                    setShowTermModal(true);
                  }}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTerm(term.id, term.name)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Term Modal */}
      {showTermModal && (
        <TermModal
          isOpen={showTermModal}
          onClose={() => {
            setShowTermModal(false);
            setEditingTerm(null);
          }}
          onSuccess={() => {
            refetchTerms();
            setShowTermModal(false);
            setEditingTerm(null);
          }}
          schoolId={schoolData?.id}
          term={editingTerm}
        />
      )}
    </div>
  );

  const renderTeachers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Teachers</h2>
      </div>

      {schoolData?.teachers?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schoolData.teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-semibold">
                    {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {teacher.firstName} {teacher.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{teacher.email}</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Joined: {new Date(teacher.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-medium text-gray-700 mb-2">No Teachers Yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Teachers can register and select your school during sign-up.
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50/80 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">How Teachers Join Your School</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Teachers visit the registration page</li>
          <li>They select your country and find "{schoolData?.name}" in the school dropdown</li>
          <li>They complete their registration</li>
          <li>They appear in your Teachers list above</li>
        </ol>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Reports & Analytics</h2>
      </div>

      <ReportDashboard
        students={students}
        classes={classes}
        terms={terms}
        subjects={subjects}
        strands={strands}
        outcomes={outcomes}
        defaultClassId=""
        defaultTermId={terms[0]?.id || ''}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="OECS Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg text-white">OHPC Kindergarten Progress Checklist</h1>
              <p className="text-xs text-slate-300">{schoolData?.name || 'School Administration'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-200 bg-slate-700 px-3 py-1.5 rounded">
              <Users size={16} />
              <span>{user?.firstName} {user?.lastName}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300">School Admin</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded text-sm transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto">
          <nav className="flex overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6">
        {renderTabContent()}
      </div>

      {/* Modals */}
      <ClassSetupModal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        onSuccess={() => {
          refetchClasses();
          setShowClassModal(false);
        }}
        schoolId={schoolData?.id}
      />

      <ClassEditModal
        isOpen={showClassEditModal}
        onClose={() => {
          setShowClassEditModal(false);
          setSelectedClass(null);
        }}
        onSuccess={() => {
          refetchClasses();
          refetchStudents();
          setShowClassEditModal(false);
          setSelectedClass(null);
        }}
        classData={selectedClass}
        teachers={schoolData?.teachers || []}
      />

      <StudentEntryModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSuccess={() => {
          refetchStudents();
          setShowStudentModal(false);
        }}
        schoolId={schoolData?.id}
      />

      <StudentEditModal
        isOpen={showStudentEditModal}
        onClose={() => {
          setShowStudentEditModal(false);
          setSelectedStudent(null);
        }}
        onSuccess={() => {
          refetchStudents();
          setShowStudentEditModal(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />

      <BulkImportStudents
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onSuccess={() => {
          refetchStudents();
        }}
        schoolId={schoolData?.id}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title={
          confirmModal.type === 'class' ? 'Delete Class' :
          confirmModal.type === 'student' ? 'Remove Student' :
          confirmModal.type === 'term' ? 'Delete Term' : 'Confirm Delete'
        }
        message={
          confirmModal.type === 'class'
            ? `Are you sure you want to delete "${confirmModal.data?.name}"? Students in this class will become unassigned.`
            : confirmModal.type === 'student'
            ? `Are you sure you want to remove "${confirmModal.data?.name}"? This action cannot be undone.`
            : confirmModal.type === 'term'
            ? `Are you sure you want to delete "${confirmModal.data?.name}"? This will only work if no assessments are linked to this term.`
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

// Term Modal Component
const TermModal = ({ isOpen, onClose, onSuccess, schoolId, term }) => {
  const [formData, setFormData] = useState({
    name: '',
    schoolYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState('');

  const createTerm = useCreateTerm();
  const updateTerm = useUpdateTerm();

  useEffect(() => {
    if (term) {
      setFormData({
        name: term.name || '',
        schoolYear: term.schoolYear || '',
        startDate: term.startDate ? new Date(term.startDate).toISOString().split('T')[0] : '',
        endDate: term.endDate ? new Date(term.endDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        name: '',
        schoolYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        startDate: '',
        endDate: '',
      });
    }
  }, [term]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.schoolYear || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      if (term) {
        await updateTerm.mutateAsync({
          id: term.id,
          data: formData,
        });
      } else {
        await createTerm.mutateAsync({
          ...formData,
          schoolId,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save term');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {term ? 'Edit Term' : 'Create New Term'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g., Term 1, Fall Semester"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Year *
            </label>
            <input
              type="text"
              value={formData.schoolYear}
              onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g., 2024-2025"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTerm.isPending || updateTerm.isPending}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
            >
              {createTerm.isPending || updateTerm.isPending ? 'Saving...' : term ? 'Save Changes' : 'Create Term'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;
