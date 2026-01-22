import { useState } from 'react';
import { X, Search, UserPlus, Users } from 'lucide-react';
import { useAssignStudentToClass } from '../hooks/useStudents';
import { useToast } from '../contexts/ToastContext';

const AssignStudentModal = ({ isOpen, onClose, onSuccess, classId, className, students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assigning, setAssigning] = useState(null);

  const assignStudent = useAssignStudentToClass();
  const toast = useToast();

  // Filter to only show unassigned students (not in any class)
  const unassignedStudents = students.filter(s => !s.classId);

  // Filter by search term
  const filteredStudents = unassignedStudents.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const idNumber = (student.studentIdNumber || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || idNumber.includes(search);
  });

  const handleAssign = async (student) => {
    setAssigning(student.id);
    try {
      await assignStudent.mutateAsync({ studentId: student.id, classId });
      toast.success(`${student.firstName} ${student.lastName} assigned to ${className}`);
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to assign student');
    } finally {
      setAssigning(null);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Assign Student to Class</h2>
            <p className="text-sm text-gray-500">{className}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {unassignedStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-700 mb-2">No Unassigned Students</h3>
              <p className="text-sm text-gray-500">
                All students are already assigned to classes.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No students match your search.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {student.studentIdNumber}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssign(student)}
                    disabled={assigning === student.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus size={14} />
                    {assigning === student.id ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignStudentModal;
