import { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useAssignStudentToClass } from '../hooks/useStudents';

const BulkAssignStudents = ({ isOpen, onClose, onSuccess, classId, className, students }) => {
  const [file, setFile] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, currentStudent: '', percent: 0 });

  const assignStudent = useAssignStudentToClass();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
      setResults(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain a header row and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Validate required headers - need at least one identifier
    const hasFirstName = headers.includes('firstname');
    const hasLastName = headers.includes('lastname');
    const hasStudentId = headers.includes('studentid');

    if (!hasStudentId && !(hasFirstName && hasLastName)) {
      throw new Error('CSV must have either "studentId" column OR both "firstName" and "lastName" columns to match students');
    }

    const entries = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());

      const entry = {};
      if (hasFirstName) entry.firstName = values[headers.indexOf('firstname')];
      if (hasLastName) entry.lastName = values[headers.indexOf('lastname')];
      if (hasStudentId) entry.studentId = values[headers.indexOf('studentid')];

      // Skip empty rows
      if (entry.studentId || (entry.firstName && entry.lastName)) {
        entries.push(entry);
      }
    }

    return entries;
  };

  const findMatchingStudent = (entry, studentList) => {
    // Try to match by studentId first (most reliable)
    if (entry.studentId) {
      const byId = studentList.find(s =>
        s.studentIdNumber?.toLowerCase() === entry.studentId.toLowerCase()
      );
      if (byId) return byId;
    }

    // Try to match by first name + last name
    if (entry.firstName && entry.lastName) {
      const byName = studentList.find(s =>
        s.firstName?.toLowerCase() === entry.firstName.toLowerCase() &&
        s.lastName?.toLowerCase() === entry.lastName.toLowerCase()
      );
      if (byName) return byName;
    }

    return null;
  };

  const handleAssign = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!classId) {
      setError('Class ID is required');
      return;
    }

    setAssigning(true);
    setError('');
    setResults(null);
    setProgress({ current: 0, total: 0, currentStudent: '', percent: 0 });

    try {
      const text = await file.text();
      const entries = parseCSV(text);

      if (entries.length === 0) {
        throw new Error('No valid student entries found in CSV');
      }

      // Get unassigned students only
      const unassignedStudents = students.filter(s => !s.classId);

      const assignResults = {
        total: entries.length,
        successful: 0,
        alreadyAssigned: 0,
        notFound: 0,
        failed: 0,
        errors: [],
      };

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const displayName = entry.firstName && entry.lastName
          ? `${entry.firstName} ${entry.lastName}`
          : entry.studentId;

        const percent = Math.round(((i + 1) / entries.length) * 100);
        setProgress({
          current: i + 1,
          total: entries.length,
          currentStudent: displayName,
          percent,
        });

        // Find matching student in system
        const matchedStudent = findMatchingStudent(entry, students);

        if (!matchedStudent) {
          assignResults.notFound++;
          assignResults.errors.push({
            student: displayName,
            error: 'Student not found in system',
          });
          continue;
        }

        // Check if already assigned to a class
        if (matchedStudent.classId) {
          assignResults.alreadyAssigned++;
          assignResults.errors.push({
            student: `${matchedStudent.firstName} ${matchedStudent.lastName}`,
            error: `Already assigned to ${matchedStudent.class?.name || 'another class'}`,
          });
          continue;
        }

        // Assign student to class
        try {
          await assignStudent.mutateAsync({ studentId: matchedStudent.id, classId });
          assignResults.successful++;
        } catch (err) {
          assignResults.failed++;
          assignResults.errors.push({
            student: `${matchedStudent.firstName} ${matchedStudent.lastName}`,
            error: err.message || 'Assignment failed',
          });
        }
      }

      setResults(assignResults);

      if (assignResults.successful > 0) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to process file');
    } finally {
      setAssigning(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'firstName,lastName,studentId\nJohn,Doe,2024-001\nJane,Smith,2024-002\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_assign_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Bulk Assign Students</h2>
            <p className="text-sm text-gray-500">Assign existing students to: {className}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Download the CSV template below</li>
              <li>Fill in student identifiers (studentId OR firstName + lastName)</li>
              <li>Students must already exist in the system</li>
              <li>Only unassigned students will be assigned to this class</li>
              <li>Upload the CSV and click "Assign Students"</li>
            </ol>
          </div>

          {/* Download Template */}
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Download size={18} />
            Download CSV Template
          </button>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 cursor-pointer transition-colors">
              <Upload size={20} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {file ? file.name : 'Click to select CSV file'}
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {/* Progress Indicator */}
          {assigning && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-indigo-900">
                  Assigning students...
                </span>
                <span className="text-sm font-bold text-indigo-700">
                  {progress.percent}%
                </span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="text-xs text-indigo-700">
                {progress.current} of {progress.total}: {progress.currentStudent}
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle size={20} />
                  <span className="font-semibold">Assignment Complete</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Total entries: {results.total}</p>
                  <p>Successfully assigned: {results.successful}</p>
                  <p>Already assigned to a class: {results.alreadyAssigned}</p>
                  <p>Not found in system: {results.notFound}</p>
                  <p>Failed: {results.failed}</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">Details:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {results.errors.map((err, idx) => (
                      <div key={idx} className="text-sm text-amber-800">
                        <span className="font-medium">{err.student}:</span> {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {results ? 'Close' : 'Cancel'}
            </button>
            {!results && (
              <button
                onClick={handleAssign}
                disabled={!file || assigning}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? 'Assigning...' : 'Assign Students'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignStudents;
