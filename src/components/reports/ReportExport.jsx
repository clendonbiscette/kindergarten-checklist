import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { useExportReport } from '../../hooks/useReports';

const ReportExport = ({ reportType, reportData, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const exportReport = useExportReport();

  const handleExport = async () => {
    try {
      await exportReport.mutateAsync({
        reportType,
        format: selectedFormat,
        reportData,
      });
      onClose?.();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Export Report</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Choose a format to download your report:
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedFormat('pdf')}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedFormat === 'pdf'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText
                size={32}
                className={selectedFormat === 'pdf' ? 'text-blue-600 mx-auto' : 'text-gray-400 mx-auto'}
              />
              <div className="mt-2 text-sm font-medium">PDF</div>
              <div className="text-xs text-gray-500">Best for printing</div>
            </button>

            <button
              onClick={() => setSelectedFormat('csv')}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedFormat === 'csv'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileSpreadsheet
                size={32}
                className={selectedFormat === 'csv' ? 'text-blue-600 mx-auto' : 'text-gray-400 mx-auto'}
              />
              <div className="mt-2 text-sm font-medium">CSV</div>
              <div className="text-xs text-gray-500">For spreadsheets</div>
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exportReport.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {exportReport.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Download {selectedFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportExport;
