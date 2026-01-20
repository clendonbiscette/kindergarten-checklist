import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateClass } from '../hooks/useClasses';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const ClassSetupModal = ({ isOpen, onClose, onSuccess, schoolId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    gradeLevel: '',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  });
  const [error, setError] = useState('');

  const createClass = useCreateClass();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.gradeLevel) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const result = await createClass.mutateAsync({
        name: formData.name,
        gradeLevel: formData.gradeLevel,
        academicYear: formData.academicYear,
        schoolId: schoolId || user?.assignments?.[0]?.schoolId,
        teacherId: user?.id,
      });

      if (result.success) {
        toast.success(`Class "${formData.name}" created successfully`);
        onSuccess(result.data);
        onClose();
        // Reset form
        setFormData({
          name: '',
          gradeLevel: '',
          academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        });
      } else {
        setError(result.message || 'Failed to create class');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the class');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Create New Class</h2>
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

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClass.isPending}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createClass.isPending ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassSetupModal;
