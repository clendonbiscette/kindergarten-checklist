import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUpdateStudent } from '../hooks/useStudents';
import { useClasses } from '../hooks/useClasses';

const StudentEditModal = ({ isOpen, onClose, onSuccess, student }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    studentIdNumber: '',
    classId: '',
    isActive: true,
  });
  const [error, setError] = useState('');

  const updateStudent = useUpdateStudent();

  // Fetch classes for the student's school
  const { data: classes = [] } = useClasses(
    student?.schoolId ? { schoolId: student.schoolId } : {}
  );

  // Populate form when student changes
  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
        studentIdNumber: student.studentIdNumber || '',
        classId: student.classId || '',
        isActive: student.isActive !== false,
      });
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName || !formData.studentIdNumber) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const result = await updateStudent.mutateAsync({
        id: student.id,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth || null,
          studentIdNumber: formData.studentIdNumber,
          classId: formData.classId || null,
          isActive: formData.isActive,
        },
      });

      if (result.success) {
        onSuccess(result.data);
        onClose();
      } else {
        setError(result.message || 'Failed to update student');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating the student');
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-edit-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="student-edit-title" className="text-xl font-bold text-gray-800">Edit Student</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="studentIdNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Student ID Number *
            </label>
            <input
              id="studentIdNumber"
              name="studentIdNumber"
              type="text"
              value={formData.studentIdNumber}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., 2024-001"
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth <span className="text-gray-500">(optional)</span>
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-2">
              Class Assignment <span className="text-gray-500">(optional)</span>
            </label>
            <select
              id="classId"
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">No Class (Unassigned)</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.gradeLevel}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Assign this student to a class or leave unassigned
            </p>
          </div>

          {/* Active status toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                Active Student
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Inactive students are hidden from assessment entry
              </p>
            </div>
            <button
              type="button"
              id="isActive"
              role="switch"
              aria-checked={formData.isActive}
              onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                formData.isActive ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  formData.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {!formData.isActive && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              This student will be hidden from assessment entry but their records are preserved.
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md text-gray-700 shadow-sm hover:shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStudent.isPending}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateStudent.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentEditModal;
