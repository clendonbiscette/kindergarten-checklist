import { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useCreateStudent } from '../hooks/useStudents';

const BulkImportStudents = ({ isOpen, onClose, onSuccess, schoolId, classId }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, currentStudent: '', percent: 0 });

  const createStudent = useCreateStudent();

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

    // Validate required headers
    const requiredHeaders = ['firstname', 'lastname', 'studentid'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Required columns are: firstName, lastName, studentId (optional: dateOfBirth)`);
    }

    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 3) continue; // Skip invalid rows

      const student = {
        firstName: values[headers.indexOf('firstname')],
        lastName: values[headers.indexOf('lastname')],
        studentIdNumber: values[headers.indexOf('studentid')],
      };

      // Optional date of birth
      const dobIndex = headers.indexOf('dateofbirth');
      if (dobIndex !== -1 && values[dobIndex]) {
        student.dateOfBirth = values[dobIndex];
      }

      students.push(student);
    }

    return students;
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!schoolId) {
      setError('School ID is required');
      return;
    }

    setImporting(true);
    setError('');
    setResults(null);
    setProgress({ current: 0, total: 0, currentStudent: '', percent: 0 });

    try {
      // Read file
      const text = await file.text();
      const students = parseCSV(text);

      if (students.length === 0) {
        throw new Error('No valid student records found in CSV');
      }

      // Import students one by one
      const importResults = {
        total: students.length,
        successful: 0,
        failed: 0,
        errors: [],
      };

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const percent = Math.round(((i + 1) / students.length) * 100);
        setProgress({
          current: i + 1,
          total: students.length,
          currentStudent: `${student.firstName} ${student.lastName}`,
          percent,
        });

        try {
          await createStudent.mutateAsync({
            ...student,
            schoolId,
            ...(classId && { classId }),
          });
          importResults.successful++;
        } catch (err) {
          importResults.failed++;
          // Extract detailed validation errors if available
          let errorMsg = err.message || 'Unknown error';
          if (err.errors && Array.isArray(err.errors)) {
            errorMsg = err.errors.map(e => `${e.field}: ${e.message}`).join(', ');
          }
          importResults.errors.push({
            student: `${student.firstName} ${student.lastName}`,
            error: errorMsg,
          });
        }
      }

      setResults(importResults);

      if (importResults.successful > 0) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to import students');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Note: dateOfBirth must be in YYYY-MM-DD format (ISO 8601)
    const csvContent = 'firstName,lastName,studentId,dateOfBirth\nJohn,Doe,2024-001,2019-05-15\nJane,Smith,2024-002,2019-08-20\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
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
          <h2 className="text-xl font-bold text-gray-800">Bulk Import Students</h2>
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
              <li>Fill in your student data (firstName, lastName, studentId are required)</li>
              <li>Date of birth format must be <strong>YYYY-MM-DD</strong> (e.g., 2019-05-15)</li>
              <li>Upload the completed CSV file</li>
              <li>Click "Import Students" to begin the import</li>
            </ol>
          </div>

          {/* Download Template */}
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <Download size={18} />
            Download CSV Template
          </button>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 cursor-pointer transition-colors">
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
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {/* Progress Indicator */}
          {importing && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-indigo-900">
                  Importing students...
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
                  <span className="font-semibold">Import Complete</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Total records: {results.total}</p>
                  <p>Successfully imported: {results.successful}</p>
                  <p>Failed: {results.failed}</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">Errors:</h4>
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {results ? 'Close' : 'Cancel'}
            </button>
            {!results && (
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import Students'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportStudents;
