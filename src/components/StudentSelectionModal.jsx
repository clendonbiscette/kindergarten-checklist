import { useState, useMemo } from 'react';
import { X, Search, UserPlus } from 'lucide-react';

const StudentSelectionModal = ({ isOpen, onClose, students, currentStudents, onAddStudents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Get IDs of currently assigned students
  const currentStudentIds = useMemo(
    () => new Set(currentStudents.map(s => s.id)),
    [currentStudents]
  );

  // Filter available students (exclude already assigned)
  const availableStudents = useMemo(() => {
    return students.filter(student => !currentStudentIds.has(student.id));
  }, [students, currentStudentIds]);

  // Filter by search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return availableStudents;

    const term = searchTerm.toLowerCase();
    return availableStudents.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(term) ||
      student.studentIdNumber?.toLowerCase().includes(term)
    );
  }, [availableStudents, searchTerm]);

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handleAddStudents = () => {
    const studentsToAdd = students.filter(s => selectedStudentIds.includes(s.id));
    onAddStudents(studentsToAdd);
    setSelectedStudentIds([]);
    setSearchTerm('');
    onClose();
  };

  const handleClose = () => {
    setSelectedStudentIds([]);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add Students to Class</h2>
            <p className="text-sm text-gray-600 mt-1">
              {availableStudents.length} students available
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search and Select All */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {filteredStudents.length > 0 && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                Select All ({filteredStudents.length})
              </label>

              {selectedStudentIds.length > 0 && (
                <span className="text-sm text-indigo-600 font-medium">
                  {selectedStudentIds.length} selected
                </span>
              )}
            </div>
          )}
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600 font-medium">
                {searchTerm ? 'No students found' : 'All students are already assigned to this class'}
              </p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search term
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <label
                  key={student.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                    selectedStudentIds.includes(student.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => handleToggleStudent(student.id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {student.firstName} {student.lastName}
                    </div>
                    {student.studentIdNumber && (
                      <div className="text-sm text-gray-500">
                        ID: {student.studentIdNumber}
                      </div>
                    )}
                  </div>
                  {student.class && (
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
                      Currently in: {student.class.name}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-md text-gray-700 shadow-sm hover:shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleAddStudents}
            disabled={selectedStudentIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus size={18} />
            Add {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} ` : ''}Student{selectedStudentIds.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentSelectionModal;
