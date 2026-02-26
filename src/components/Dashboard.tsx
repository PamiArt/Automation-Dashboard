import React, { useState, useRef } from 'react';
import { ProcessedData } from '../utils/dataProcessing';
import { Download, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import _ from 'lodash';

interface DashboardProps {
  data: ProcessedData;
  onBack: () => void;
}

type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

interface ChartConfig {
  id: string;
  type: ChartType;
  xAxis: string;
  yAxis: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Dashboard: React.FC<DashboardProps> = ({ data, onBack }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [charts, setCharts] = useState<ChartConfig[]>([
    { id: '1', type: 'bar', xAxis: data.categoricalColumns[0] || data.columns[0], yAxis: data.numericColumns[0] || data.columns[1] },
    { id: '2', type: 'line', xAxis: data.columns[0], yAxis: data.numericColumns[0] || data.columns[1] },
  ]);

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;
    
    const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Pami_Automation_Dashboard.pdf');
  };

  const addChart = () => {
    setCharts([
      ...charts,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'bar',
        xAxis: data.columns[0],
        yAxis: data.numericColumns[0] || data.columns[1]
      }
    ]);
  };

  const removeChart = (id: string) => {
    setCharts(charts.filter(c => c.id !== id));
  };

  const updateChart = (id: string, updates: Partial<ChartConfig>) => {
    setCharts(charts.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const renderChart = (config: ChartConfig) => {
    // Prepare data based on selected axes
    let chartData: any[] = [];

    if (config.type === 'pie' || config.type === 'bar') {
      // Aggregate data if categorical on X
      const isCategoricalX = data.categoricalColumns.includes(config.xAxis);
      if (isCategoricalX) {
        const grouped = _.groupBy(data.data, config.xAxis);
        chartData = Object.entries(grouped).map(([key, group]) => {
          const validY = group.map(d => Number(d[config.yAxis])).filter(n => !isNaN(n));
          return {
            name: key,
            value: validY.length > 0 ? _.mean(validY) : 0, // Mean value for the group
            count: group.length
          };
        }).slice(0, 20); // Limit to top 20 for readability
      } else {
        // Just take first 50 rows if both numeric
        chartData = data.data.slice(0, 50).map(d => ({
          name: d[config.xAxis],
          value: Number(d[config.yAxis]) || 0
        }));
      }
    } else if (config.type === 'scatter') {
      chartData = data.data
        .map(d => ({ x: Number(d[config.xAxis]), y: Number(d[config.yAxis]) }))
        .filter(d => !isNaN(d.x) && !isNaN(d.y))
        .slice(0, 500);
    } else if (config.type === 'line') {
      chartData = data.data.slice(0, 100).map(d => ({
        name: d[config.xAxis],
        value: Number(d[config.yAxis]) || 0
      }));
    }

    return (
      <div key={config.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <div className="flex gap-2 items-center">
            <select
              value={config.type}
              onChange={(e) => updateChart(config.id, { type: e.target.value as ChartType })}
              className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="scatter">Scatter Plot</option>
            </select>
            
            <select
              value={config.xAxis}
              onChange={(e) => updateChart(config.id, { xAxis: e.target.value })}
              className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none max-w-[120px] truncate"
            >
              {data.columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>

            <span className="text-slate-400 text-sm">vs</span>

            <select
              value={config.yAxis}
              onChange={(e) => updateChart(config.id, { yAxis: e.target.value })}
              className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none max-w-[120px] truncate"
            >
              {data.numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
              {data.numericColumns.length === 0 && data.columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
          
          <button
            onClick={() => removeChart(config.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {config.type === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : config.type === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            ) : config.type === 'pie' ? (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
              </PieChart>
            ) : (
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="x" name={config.xAxis} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="y" name={config.yAxis} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Scatter name="Data" data={chartData} fill="#f59e0b" />
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </div>
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
        <div className="flex gap-4">
          <button
            onClick={addChart}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Chart
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download PDF Dashboard
          </button>
        </div>
      </div>

      <div ref={dashboardRef} className="bg-slate-50 p-8 rounded-2xl min-h-[80vh]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Interactive Dashboard</h1>
          <p className="text-slate-500">Customize your view by selecting chart types and variables.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {charts.map(renderChart)}
        </div>
        
        {charts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500">
            <p className="mb-4">No charts to display.</p>
            <button
              onClick={addChart}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add your first chart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
