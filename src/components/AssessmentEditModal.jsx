import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUpdateAssessment } from '../hooks/useAssessments';

const AssessmentEditModal = ({ isOpen, onClose, assessment, onSuccess }) => {
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateAssessment = useUpdateAssessment();

  useEffect(() => {
    if (assessment) {
      setRating(assessment.rating || '');
      setComment(assessment.comment || '');
    }
  }, [assessment]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateAssessment.mutateAsync({
        id: assessment.id,
        data: {
          rating,
          comment: comment || undefined
        }
      });

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error updating assessment:', error);
      alert('Failed to update assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingSymbol = (value) => {
    const map = { 'EASILY_MEETING': '+', 'MEETING': '=', 'NEEDS_PRACTICE': 'x' };
    return map[value];
  };

  const getRatingLabel = (value) => {
    const map = {
      'EASILY_MEETING': 'Easily Meeting Expectations',
      'MEETING': 'Meeting Expectations',
      'NEEDS_PRACTICE': 'Needs Practice'
    };
    return map[value];
  };

  if (!isOpen || !assessment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Edit Assessment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Learning Outcome Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Learning Outcome</div>
            <div className="font-mono text-sm font-semibold text-gray-800 mb-2">
              {assessment.learningOutcome?.code}
            </div>
            <div className="text-sm text-gray-700">
              {assessment.learningOutcome?.description}
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Student</div>
              <div className="font-medium">
                {assessment.student?.firstName} {assessment.student?.lastName}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Assessment Date</div>
              <div className="font-medium">
                {new Date(assessment.assessmentDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Rating Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRating('EASILY_MEETING')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  rating === 'EASILY_MEETING'
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-offset-2'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="text-3xl font-bold text-green-600 mb-1">+</div>
                <div className="text-xs text-gray-700">Easily Meeting</div>
              </button>

              <button
                type="button"
                onClick={() => setRating('MEETING')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  rating === 'MEETING'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="text-3xl font-bold text-blue-600 mb-1">=</div>
                <div className="text-xs text-gray-700">Meeting</div>
              </button>

              <button
                type="button"
                onClick={() => setRating('NEEDS_PRACTICE')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  rating === 'NEEDS_PRACTICE'
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500 ring-offset-2'
                    : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                <div className="text-3xl font-bold text-amber-600 mb-1">×</div>
                <div className="text-xs text-gray-700">Needs Practice</div>
              </button>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              Comment (Optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any observations or notes about this assessment..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-gray-700 rounded-md shadow-sm hover:shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !rating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssessmentEditModal;
