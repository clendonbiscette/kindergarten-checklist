import React from 'react';
import { BookOpen, Users, AlertCircle } from 'lucide-react';
import RatingBadge, { RatingLegend } from './RatingBadge';
import LoadingSpinner from '../LoadingSpinner';

const StrandReport = ({ data, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Loading strand report..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="mr-2" />
        Failed to load report: {error.message}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select a strand to view the report
      </div>
    );
  }

  const { strand, class: classInfo, outcomes, studentMatrix, outcomeStats, overallStats } = data;

  return (
    <div className="space-y-6">
      {/* Strand Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen size={24} className="text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">{strand.name}</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {strand.subjectName} | {classInfo?.name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {overallStats.performanceScore}%
            </div>
            <div className="text-xs text-gray-500">Class Average</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {overallStats.totalStudents}
              </div>
              <div className="text-xs text-gray-500">Students</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">
            {overallStats.ratingDistribution.EASILY_MEETING}
          </div>
          <div className="text-xs text-green-600">Easily Meeting</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">
            {overallStats.ratingDistribution.MEETING}
          </div>
          <div className="text-xs text-blue-600">Meeting</div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-700">
            {overallStats.ratingDistribution.NEEDS_PRACTICE}
          </div>
          <div className="text-xs text-amber-600">Needs Practice</div>
        </div>
      </div>

      {/* Rating Legend */}
      <div className="bg-gray-50 rounded-lg p-3">
        <RatingLegend />
      </div>

      {/* Outcome Performance Summary */}
      {outcomeStats && outcomeStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Outcome Performance</h3>
          <div className="space-y-2">
            {outcomeStats.map((stat) => (
              <div
                key={stat.outcome.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold px-2 py-1 bg-white rounded border">
                    {stat.outcome.code}
                  </span>
                  <span className="text-sm text-gray-700 truncate max-w-md">
                    {stat.outcome.description}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600">+{stat.ratingDistribution.EASILY_MEETING}</span>
                    <span className="text-blue-600">={stat.ratingDistribution.MEETING}</span>
                    <span className="text-amber-600">x{stat.ratingDistribution.NEEDS_PRACTICE}</span>
                  </div>
                  <span className="font-semibold text-gray-800 w-12 text-right">
                    {stat.performanceScore}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Matrix Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Student Progress Grid</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50">
                  Student
                </th>
                {outcomes.map((outcome) => (
                  <th
                    key={outcome.id}
                    className="px-2 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[60px]"
                    title={outcome.description}
                  >
                    {outcome.code}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {studentMatrix.map((row, idx) => (
                <tr key={row.student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium sticky left-0 bg-inherit whitespace-nowrap">
                    {row.student.firstName} {row.student.lastName.charAt(0)}.
                  </td>
                  {outcomes.map((outcome) => (
                    <td key={outcome.id} className="px-2 py-3 text-center">
                      {row.outcomeRatings[outcome.id] ? (
                        <RatingBadge rating={row.outcomeRatings[outcome.id]} size="sm" />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${
                      row.performanceScore >= 70
                        ? 'text-green-600'
                        : row.performanceScore >= 50
                        ? 'text-blue-600'
                        : 'text-amber-600'
                    }`}>
                      {row.performanceScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StrandReport;
