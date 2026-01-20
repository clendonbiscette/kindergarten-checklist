import React from 'react';
import { BookOpen, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import RatingBadge, { RatingLegend } from './RatingBadge';
import LoadingSpinner from '../LoadingSpinner';

const StudentReport = ({ data, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Loading student report..." />
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
        Select a student to view their report
      </div>
    );
  }

  const { student, overallStats, subjects } = data;

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-sm text-gray-600">
              {student.class} | {student.school}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {overallStats.performanceScore}%
            </div>
            <div className="text-xs text-gray-500">Overall Performance</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {overallStats.totalAssessments}
              </div>
              <div className="text-xs text-gray-500">Total Assessments</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {overallStats.completionRate}%
              </div>
              <div className="text-xs text-gray-500">Completion Rate</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">
            {overallStats.ratingDistribution.EASILY_MEETING}
          </div>
          <div className="text-xs text-green-600">Easily Meeting</div>
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

      {/* Subject Breakdown */}
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.subjectId} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-blue-600" />
                <h3 className="font-semibold text-gray-800">{subject.subjectName}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  {subject.assessedOutcomes}/{subject.totalOutcomes} outcomes
                </span>
                <span className="font-semibold text-blue-600">
                  {subject.performanceScore}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{subject.completionRate}% complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${subject.completionRate}%` }}
                />
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-xs">
                <RatingBadge rating="EASILY_MEETING" size="sm" />
                <span className="text-gray-600">{subject.ratingDistribution.EASILY_MEETING}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <RatingBadge rating="MEETING" size="sm" />
                <span className="text-gray-600">{subject.ratingDistribution.MEETING}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <RatingBadge rating="NEEDS_PRACTICE" size="sm" />
                <span className="text-gray-600">{subject.ratingDistribution.NEEDS_PRACTICE}</span>
              </div>
            </div>

            {/* Strands (expandable) */}
            {subject.strands && subject.strands.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="text-xs font-medium text-gray-600 mb-2">By Strand:</div>
                <div className="space-y-2">
                  {subject.strands.map((strand) => (
                    <div
                      key={strand.strandId}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-700">{strand.strandName}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <span className="text-xs text-green-600">
                            +{strand.ratingDistribution.EASILY_MEETING}
                          </span>
                          <span className="text-xs text-blue-600">
                            ={strand.ratingDistribution.MEETING}
                          </span>
                          <span className="text-xs text-amber-600">
                            x{strand.ratingDistribution.NEEDS_PRACTICE}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {strand.performanceScore}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentReport;
