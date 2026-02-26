import React, { useRef } from 'react';
import { ProcessedData } from '../utils/dataProcessing';
import { Download, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportProps {
  data: ProcessedData;
  onBack: () => void;
}

export const Report: React.FC<ReportProps> = ({ data, onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Pami_Automation_Report.pdf');
  };

  const renderSummaryStats = () => (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-8">
      <table className="w-full text-sm text-left text-slate-500">
        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3">Column</th>
            <th className="px-6 py-3">Type</th>
            <th className="px-6 py-3">Count</th>
            <th className="px-6 py-3">Missing</th>
            <th className="px-6 py-3">Mean</th>
            <th className="px-6 py-3">Median</th>
            <th className="px-6 py-3">Unique</th>
          </tr>
        </thead>
        <tbody>
          {data.stats.map((stat, idx) => (
            <tr key={idx} className="bg-white border-b border-slate-100 hover:bg-slate-50">
              <td className="px-6 py-4 font-medium text-slate-900">{stat.name}</td>
              <td className="px-6 py-4">{stat.type}</td>
              <td className="px-6 py-4">{stat.count}</td>
              <td className="px-6 py-4">{stat.missing}</td>
              <td className="px-6 py-4">{stat.mean !== undefined ? stat.mean.toFixed(2) : '-'}</td>
              <td className="px-6 py-4">{stat.median !== undefined ? stat.median.toFixed(2) : '-'}</td>
              <td className="px-6 py-4">{stat.uniqueCount !== undefined ? stat.uniqueCount : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAutoCharts = () => {
    // Generate some basic charts based on data types
    const charts = [];

    // 1. Bar chart for top categorical columns
    if (data.categoricalColumns.length > 0) {
      const col = data.categoricalColumns[0];
      const stat = data.stats.find(s => s.name === col);
      if (stat && stat.topValues) {
        charts.push(
          <div key={`bar-${col}`} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Values: {col}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stat.topValues}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="value" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
    }

    // 2. Histogram/Bar for numeric column distribution (simplified)
    if (data.numericColumns.length > 0) {
      const col = data.numericColumns[0];
      // Create simple bins
      const values = data.data.map(d => Number(d[col])).filter(n => !isNaN(n));
      const min = Math.min(...values);
      const max = Math.max(...values);
      const binCount = 10;
      const binSize = (max - min) / binCount;
      
      const bins = Array.from({ length: binCount }, (_, i) => ({
        range: `${(min + i * binSize).toFixed(1)} - ${(min + (i + 1) * binSize).toFixed(1)}`,
        count: 0
      }));

      values.forEach(v => {
        const binIndex = Math.min(Math.floor((v - min) / binSize), binCount - 1);
        if (bins[binIndex]) bins[binIndex].count++;
      });

      charts.push(
        <div key={`hist-${col}`} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribution: {col}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bins}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    // 3. Scatter plot if at least 2 numeric columns
    if (data.numericColumns.length >= 2) {
      const col1 = data.numericColumns[0];
      const col2 = data.numericColumns[1];
      const scatterData = data.data
        .map(d => ({ x: Number(d[col1]), y: Number(d[col2]) }))
        .filter(d => !isNaN(d.x) && !isNaN(d.y))
        .slice(0, 500); // Limit points for performance

      charts.push(
        <div key={`scatter-${col1}-${col2}`} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Scatter: {col1} vs {col2}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="x" name={col1} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="y" name={col2} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Scatter name="Data" data={scatterData} fill="#f59e0b" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {charts}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download PDF Report
        </button>
      </div>

      <div ref={reportRef} className="bg-slate-50 p-8 rounded-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dataset Report</h1>
          <p className="text-slate-500">Generated automatically from your uploaded dataset.</p>
        </div>

        <h2 className="text-xl font-semibold text-slate-800 mb-4">Summary Statistics</h2>
        {renderSummaryStats()}

        <h2 className="text-xl font-semibold text-slate-800 mb-4">Auto-Generated Charts</h2>
        {renderAutoCharts()}
      </div>
    </div>
  );
};
