import React from 'react';
import { Filter } from 'lucide-react';

const ReportFilters = ({
  terms = [],
  classes = [],
  subjects = [],
  strands = [],
  selectedTermId,
  selectedClassId,
  selectedSubjectId,
  selectedStrandId,
  onTermChange,
  onClassChange,
  onSubjectChange,
  onStrandChange,
  showTerm = true,
  showClass = true,
  showSubject = false,
  showStrand = false,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter size={16} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filters</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {showTerm && (
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
            <select
              value={selectedTermId || ''}
              onChange={(e) => onTermChange?.(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            >
              <option value="">All Terms</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name} ({term.schoolYear})
                </option>
              ))}
            </select>
          </div>
        )}

        {showClass && (
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
            <select
              value={selectedClassId || ''}
              onChange={(e) => onClassChange?.(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.gradeLevel})
                </option>
              ))}
            </select>
          </div>
        )}

        {showSubject && (
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
            <select
              value={selectedSubjectId || ''}
              onChange={(e) => onSubjectChange?.(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showStrand && (
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Strand</label>
            <select
              value={selectedStrandId || ''}
              onChange={(e) => onStrandChange?.(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            >
              <option value="">Select a strand</option>
              {strands.map((strand) => (
                <option key={strand.id} value={strand.id}>
                  {strand.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportFilters;
