import React from 'react';
import { format } from 'date-fns';
import { FileText, Download, AlertCircle } from 'lucide-react';
import RatingBadge, { RatingLegend } from './RatingBadge';
import LoadingSpinner from '../LoadingSpinner';

/**
 * StudentSubjectReport - Detailed report matching the template format
 * Shows all assessments for a student in a specific subject, organized by strand
 * with columns for each assessment date showing rating and comment
 */
const StudentSubjectReport = ({ data, isLoading, error, onExportPDF }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Loading student subject report..." />
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
        Select a student and subject to view the detailed report
      </div>
    );
  }

  const { student, subject, term, assessmentDates, strands, summary } = data;

  // Format dates for column headers
  const formattedDates = assessmentDates.map((date) => ({
    raw: date,
    display: format(new Date(date), 'MMM d'),
    full: format(new Date(date), 'MMM d, yyyy'),
  }));

  return (
    <div className="space-y-4">
      {/* Report Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 print:shadow-none">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">
                {subject.name} Progress Report
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
              <div>
                <span className="font-medium">Learner:</span>{' '}
                {student.firstName} {student.lastName}
              </div>
              <div>
                <span className="font-medium">Student ID:</span>{' '}
                {student.studentIdNumber || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Class:</span> {student.class}
              </div>
              <div>
                <span className="font-medium">School:</span> {student.school}
              </div>
              {term && (
                <div>
                  <span className="font-medium">Term:</span> {term.name} ({term.schoolYear})
                </div>
              )}
              <div>
                <span className="font-medium">Generated:</span>{' '}
                {format(new Date(), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors print:hidden"
            >
              <Download size={18} />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm p-4 print:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {summary.assessedOutcomes}/{summary.totalOutcomes}
              </div>
              <div className="text-xs text-gray-500">Outcomes Assessed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.completionRate}%
              </div>
              <div className="text-xs text-gray-500">Completion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.performanceScore}%
              </div>
              <div className="text-xs text-gray-500">Performance</div>
            </div>
          </div>
          <RatingLegend />
        </div>
      </div>

      {/* Assessment Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {/* Date row */}
              <tr className="bg-gray-100 border-b">
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-16">
                  SCO No.
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 min-w-[200px]">
                  Outcome
                </th>
                {formattedDates.map((date) => (
                  <th
                    key={date.raw}
                    colSpan={2}
                    className="px-3 py-2 text-center font-semibold text-gray-700 border-l"
                    title={date.full}
                  >
                    {date.display}
                  </th>
                ))}
                {formattedDates.length === 0 && (
                  <th colSpan={2} className="px-3 py-2 text-center text-gray-400 border-l">
                    No assessments yet
                  </th>
                )}
              </tr>
              {/* Assessment/Comment subheader row */}
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-1"></th>
                <th className="px-3 py-1"></th>
                {formattedDates.map((date) => (
                  <React.Fragment key={date.raw}>
                    <th className="px-2 py-1 text-center text-xs text-gray-500 font-medium border-l">
                      Rating
                    </th>
                    <th className="px-2 py-1 text-center text-xs text-gray-500 font-medium">
                      Comment
                    </th>
                  </React.Fragment>
                ))}
                {formattedDates.length === 0 && (
                  <>
                    <th className="px-2 py-1 text-center text-xs text-gray-400 font-medium border-l">
                      Rating
                    </th>
                    <th className="px-2 py-1 text-center text-xs text-gray-400 font-medium">
                      Comment
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {strands.map((strand, strandIndex) => (
                <React.Fragment key={strand.id}>
                  {/* Strand header row */}
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td
                      colSpan={2 + (formattedDates.length > 0 ? formattedDates.length * 2 : 2)}
                      className="px-3 py-2 font-semibold text-blue-800"
                    >
                      Strand: {strand.name}
                    </td>
                  </tr>
                  {/* Outcome rows */}
                  {strand.outcomes.map((outcome, outcomeIndex) => (
                    <tr
                      key={outcome.id}
                      className={outcomeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-3 py-2 text-gray-600 font-mono text-xs">
                        {outcome.code}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{outcome.description}</td>
                      {formattedDates.map((date) => {
                        const assessment = outcome.assessmentsByDate[date.raw];
                        return (
                          <React.Fragment key={date.raw}>
                            <td className="px-2 py-2 text-center border-l">
                              {assessment ? (
                                <RatingBadge rating={assessment.rating} size="sm" />
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-xs text-gray-500 max-w-[150px] truncate">
                              {assessment?.comment || ''}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      {formattedDates.length === 0 && (
                        <>
                          <td className="px-2 py-2 text-center border-l">
                            <span className="text-gray-300">-</span>
                          </td>
                          <td className="px-2 py-2 text-xs text-gray-400">-</td>
                        </>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rating Distribution Summary */}
      <div className="bg-white rounded-lg shadow-sm p-4 print:shadow-none">
        <h3 className="font-semibold text-gray-700 mb-2">Rating Distribution</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <RatingBadge rating="EASILY_MEETING" size="sm" />
            <span className="text-sm text-gray-600">
              {summary.ratingDistribution.EASILY_MEETING} assessments
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RatingBadge rating="MEETING" size="sm" />
            <span className="text-sm text-gray-600">
              {summary.ratingDistribution.MEETING} assessments
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RatingBadge rating="NEEDS_PRACTICE" size="sm" />
            <span className="text-sm text-gray-600">
              {summary.ratingDistribution.NEEDS_PRACTICE} assessments
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSubjectReport;
