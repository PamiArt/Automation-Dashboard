import React, { useState } from "react";
import Plot from "react-plotly.js";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AutoDashboard() {
  const [data, setData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [charts, setCharts] = useState([
    { type: "line", x: "", y: "" },
    { type: "bar", x: "", y: "" },
    { type: "pie", labels: "", values: "" },
  ]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          setData(results.data);
          setColumns(Object.keys(results.data[0] || {}));
        },
      });
    } else if (ext === "xlsx") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws, { defval: null });
        setData(jsonData);
        setColumns(Object.keys(jsonData[0] || {}));
      };
      reader.readAsBinaryString(file);
    } else if (ext === "json") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const jsonData = JSON.parse(evt.target.result);
        setData(jsonData);
        setColumns(Object.keys(jsonData[0] || {}));
      };
      reader.readAsText(file);
    } else {
      alert("Unsupported file type!");
    }
    // Reset charts
    setCharts([
      { type: "line", x: "", y: "" },
      { type: "bar", x: "", y: "" },
      { type: "pie", labels: "", values: "" },
    ]);
  };

  // Handle chart variable change
  const handleChartChange = (index, field, value) => {
    const newCharts = [...charts];
    newCharts[index][field] = value;
    setCharts(newCharts);
  };

  // Download dashboard as PDF
  const downloadPDF = () => {
    const input = document.getElementById("dashboard");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("dashboard.pdf");
    });
  };

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto mt-12 text-center px-4">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Pami Automation Dashboard</h2>
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-medium text-slate-700 mb-2">Upload Dataset</label>
          <input
            type="file"
            accept=".csv,.xlsx,.json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-300 rounded-lg p-2"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4" id="dashboard">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Interactive Dashboard</h2>
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium" 
          onClick={downloadPDF}
        >
          Download PDF Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {charts.map((chart, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h5 className="text-lg font-semibold text-slate-700 mb-4 capitalize">Chart {idx + 1} ({chart.type})</h5>
            {chart.type === "pie" ? (
              <>
                <select
                  className="w-full mb-3 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                  onChange={(e) => handleChartChange(idx, "labels", e.target.value)}
                  value={chart.labels}
                >
                  <option value="">Select labels</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <select
                  className="w-full mb-4 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                  onChange={(e) => handleChartChange(idx, "values", e.target.value)}
                  value={chart.values}
                >
                  <option value="">Select values</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                {chart.labels && chart.values && (
                  <div className="w-full overflow-hidden flex justify-center">
                    <Plot
                      data={[
                        {
                          type: "pie",
                          labels: data.map((row) => row[chart.labels]),
                          values: data.map((row) => row[chart.values]),
                        },
                      ]}
                      layout={{ width: 400, height: 350, margin: { t: 20, b: 20, l: 20, r: 20 } }}
                      config={{ responsive: true }}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <select
                  className="w-full mb-3 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                  onChange={(e) => handleChartChange(idx, "x", e.target.value)}
                  value={chart.x}
                >
                  <option value="">Select X-axis</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <select
                  className="w-full mb-4 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                  onChange={(e) => handleChartChange(idx, "y", e.target.value)}
                  value={chart.y}
                >
                  <option value="">Select Y-axis</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                {chart.x && chart.y && (
                  <div className="w-full overflow-hidden flex justify-center">
                    <Plot
                      data={[
                        {
                          x: data.map((row) => row[chart.x]),
                          y: data.map((row) => row[chart.y]),
                          type: chart.type,
                          mode: "lines+markers",
                          marker: { color: '#6366f1' },
                          line: { color: '#6366f1' }
                        },
                      ]}
                      layout={{ width: 400, height: 350, margin: { t: 20, b: 40, l: 40, r: 20 } }}
                      config={{ responsive: true }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
