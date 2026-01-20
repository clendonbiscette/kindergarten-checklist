import React from 'react';
import { Target, Users, AlertCircle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import RatingBadge, { RatingLegend } from './RatingBadge';
import LoadingSpinner from '../LoadingSpinner';

const OutcomeReport = ({ data, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Loading outcome report..." />
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
        Select an outcome to view the report
      </div>
    );
  }

  const { outcome, class: classInfo, studentResults, overallStats } = data;

  return (
    <div className="space-y-6">
      {/* Outcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target size={24} className="text-blue-600" />
              <span className="font-mono text-sm font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {outcome.code}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              {outcome.description}
            </h2>
            <p className="text-sm text-gray-600">
              {outcome.subjectName} | {outcome.strandName} | {classInfo?.name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {overallStats.performanceScore}%
            </div>
            <div className="text-xs text-gray-500">Class Performance</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {overallStats.totalStudents}
              </div>
              <div className="text-xs text-gray-500">Total Students</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {overallStats.assessedStudents}
              </div>
              <div className="text-xs text-gray-500">Assessed</div>
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

      {/* Not Assessed Warning */}
      {overallStats.notAssessed > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-yellow-800 font-medium">
              {overallStats.notAssessed} student{overallStats.notAssessed > 1 ? 's' : ''} not yet assessed
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              These students have not been evaluated for this learning outcome yet.
            </p>
          </div>
        </div>
      )}

      {/* Student Results */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Student Results</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {studentResults.map((result) => (
            <div
              key={result.student.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                !result.latestRating ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {result.latestRating ? (
                    <RatingBadge rating={result.latestRating} size="lg" />
                  ) : (
                    <span className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded text-sm font-medium">
                      Not Assessed
                    </span>
                  )}
                  <div>
                    <span className="font-medium text-gray-900">
                      {result.student.firstName} {result.student.lastName}
                    </span>
                    {result.assessmentCount > 1 && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({result.assessmentCount} assessments)
                      </span>
                    )}
                  </div>
                </div>

                {result.latestDate && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {new Date(result.latestDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {result.latestComment && (
                <div className="mt-2 ml-12 flex items-start gap-2 text-sm text-gray-600">
                  <MessageSquare size={14} className="flex-shrink-0 mt-0.5" />
                  <span className="italic">{result.latestComment}</span>
                </div>
              )}

              {/* Assessment History (collapsed) */}
              {result.history && result.history.length > 1 && (
                <details className="mt-3 ml-12">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                    View history ({result.history.length} records)
                  </summary>
                  <div className="mt-2 space-y-2">
                    {result.history.slice(1).map((h, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs text-gray-600 py-1">
                        <RatingBadge rating={h.rating} size="sm" />
                        <span>{new Date(h.date).toLocaleDateString()}</span>
                        {h.term && <span className="text-gray-400">({h.term.name})</span>}
                        {h.comment && <span className="italic truncate max-w-xs">{h.comment}</span>}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OutcomeReport;
