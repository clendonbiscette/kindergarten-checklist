import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useCreateStudent } from '../hooks/useStudents';
import { useToast } from '../contexts/ToastContext';

const CreateStudentModal = ({ isOpen, onClose, onSuccess, classId, className }) => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', dateOfBirth: '' });
  const [error, setError] = useState('');

  const createStudent = useCreateStudent();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        ...(formData.dateOfBirth && { dateOfBirth: formData.dateOfBirth }),
        ...(classId && { classId }),
      };
      await createStudent.mutateAsync(payload);
      toast.success(`${formData.firstName.trim()} ${formData.lastName.trim()} added successfully`);
      setFormData({ firstName: '', lastName: '', dateOfBirth: '' });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add student. Please try again.');
    }
  };

  const handleClose = () => {
    setFormData({ firstName: '', lastName: '', dateOfBirth: '' });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-student-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 id="create-student-title" className="text-lg font-bold text-gray-800">Add New Student</h2>
            {className && (
              <p className="text-sm text-gray-500">Adding to {className}</p>
            )}
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Maria"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Thompson"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStudent.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={16} />
              {createStudent.isPending ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStudentModal;
