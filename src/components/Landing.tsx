import React, { useState } from 'react';
import { UploadCloud, FileText, LayoutDashboard } from 'lucide-react';
import { parseFile, processData, ProcessedData } from '../utils/dataProcessing';

interface LandingProps {
  onDataLoaded: (data: ProcessedData) => void;
  onNavigate: (view: 'report' | 'dashboard') => void;
}

export const Landing: React.FC<LandingProps> = ({ onDataLoaded, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileLoaded, setFileLoaded] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setFileLoaded(false);

    try {
      const parsedData = await parseFile(file);
      const processedData = processData(parsedData);
      onDataLoaded(processedData);
      setFileLoaded(true);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-6">
        Pami Automation Dashboard
      </h1>
      <p className="text-lg text-slate-600 mb-12 max-w-2xl">
        Upload your dataset (.xlsx, .csv, .json) to instantly generate comprehensive reports and interactive dashboards. No data is saved on our servers.
      </p>

      <div className="w-full max-w-md">
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
            loading ? 'bg-slate-50 border-slate-300' : 'bg-white border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className={`w-12 h-12 mb-4 ${loading ? 'text-slate-400 animate-pulse' : 'text-indigo-500'}`} />
            <p className="mb-2 text-sm text-slate-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-400">XLSX, CSV, JSON (max. 50MB)</p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/json"
            onChange={handleFileUpload}
            disabled={loading}
          />
        </label>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl max-w-md w-full text-sm">
          {error}
        </div>
      )}

      {fileLoaded && (
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
          <button
            onClick={() => onNavigate('report')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm font-medium"
          >
            <FileText className="w-5 h-5" />
            Generate Report
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm font-medium"
          >
            <LayoutDashboard className="w-5 h-5" />
            Create Dashboard
          </button>
        </div>
      )}
    </div>
  );
};
