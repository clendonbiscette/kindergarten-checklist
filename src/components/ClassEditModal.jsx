import { useState, useEffect } from 'react';
import { X, UserPlus, Users, UserCheck } from 'lucide-react';
import { useUpdateClass } from '../hooks/useClasses';
import { useStudents, useUpdateStudent } from '../hooks/useStudents';
import StudentSelectionModal from './StudentSelectionModal';

const ClassEditModal = ({ isOpen, onClose, onSuccess, classData, teachers = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    gradeLevel: '',
    academicYear: '',
    teacherId: '',
  });
  const [error, setError] = useState('');
  const [showStudentSelector, setShowStudentSelector] = useState(false);

  const updateClass = useUpdateClass();
  const updateStudent = useUpdateStudent();

  // Fetch all students from the same school
  const { data: allStudents = [] } = useStudents(
    classData?.schoolId ? { schoolId: classData.schoolId } : {}
  );

  // Get students currently in this class
  const classStudents = allStudents.filter(student => student.classId === classData?.id);

  // Populate form when classData changes
  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        gradeLevel: classData.gradeLevel || '',
        academicYear: classData.academicYear || '',
        teacherId: classData.teacherId || '',
      });
    }
  }, [classData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudents = async (studentsToAdd) => {
    try {
      // Update each student's classId to assign them to this class
      await Promise.all(
        studentsToAdd.map(student =>
          updateStudent.mutateAsync({
            id: student.id,
            data: { classId: classData.id }
          })
        )
      );
    } catch (err) {
      setError(`Failed to add students: ${err.message}`);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      // Set classId to null to unassign the student
      await updateStudent.mutateAsync({
        id: studentId,
        data: { classId: null }
      });
    } catch (err) {
      setError(`Failed to remove student: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.gradeLevel) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const result = await updateClass.mutateAsync({
        id: classData.id,
        data: {
          name: formData.name,
          gradeLevel: formData.gradeLevel,
          academicYear: formData.academicYear,
          teacherId: formData.teacherId || null,
        },
      });

      if (result.success) {
        onSuccess(result.data);
        onClose();
      } else {
        setError(result.message || 'Failed to update class');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating the class');
    }
  };

  if (!isOpen || !classData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Edit Class</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Class Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Morning Kindergarten, K1-A"
            />
          </div>

          <div>
            <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-2">
              Grade Level *
            </label>
            <select
              id="gradeLevel"
              name="gradeLevel"
              value={formData.gradeLevel}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select grade level...</option>
              <option value="Pre-K">Pre-K</option>
              <option value="Kindergarten">Kindergarten</option>
              <option value="K1">K1</option>
              <option value="K2">K2</option>
            </select>
          </div>

          <div>
            <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year *
            </label>
            <input
              id="academicYear"
              name="academicYear"
              type="text"
              value={formData.academicYear}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., 2024-2025"
            />
          </div>

          {/* Teacher Assignment */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck size={18} className="text-gray-600" />
              <label htmlFor="teacherId" className="text-sm font-medium text-gray-700">
                Assigned Teacher
              </label>
            </div>
            <select
              id="teacherId"
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">No Teacher Assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstName} {teacher.lastName} ({teacher.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select a teacher to manage this class
            </p>
          </div>

          {/* Student Assignment Section */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-gray-600" />
                <label className="text-sm font-medium text-gray-700">
                  Students in Class
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentSelector(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <UserPlus size={16} />
                Add Students
              </button>
            </div>

            {classStudents.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Users className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-600">No students assigned yet</p>
                <p className="text-xs text-gray-500 mt-1">Click "Add Students" to assign students to this class</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {classStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        {student.firstName} {student.lastName}
                      </div>
                      {student.studentIdNumber && (
                        <div className="text-xs text-gray-500">
                          ID: {student.studentIdNumber}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStudent(student.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove from class"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2 text-xs text-gray-500">
              Total: {classStudents.length} student{classStudents.length !== 1 ? 's' : ''}
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
              className="flex-1 px-4 py-2 rounded-md text-gray-700 shadow-sm hover:shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateClass.isPending}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateClass.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Student Selection Modal */}
      <StudentSelectionModal
        isOpen={showStudentSelector}
        onClose={() => setShowStudentSelector(false)}
        students={allStudents}
        currentStudents={classStudents}
        onAddStudents={handleAddStudents}
      />
    </div>
  );
};

export default ClassEditModal;
