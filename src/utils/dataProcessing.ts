import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import _ from 'lodash';

export interface ColumnStats {
  name: string;
  type: 'numeric' | 'categorical' | 'boolean' | 'date' | 'unknown';
  count: number;
  missing: number;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  uniqueCount?: number;
  topValues?: { value: any; count: number }[];
}

export interface ProcessedData {
  data: any[];
  columns: string[];
  stats: ColumnStats[];
  numericColumns: string[];
  categoricalColumns: string[];
}

export const parseFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('Failed to read file');

        if (file.name.endsWith('.csv')) {
          Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err),
          });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } else if (file.name.endsWith('.json')) {
          const json = JSON.parse(data as string);
          resolve(Array.isArray(json) ? json : [json]);
        } else {
          reject(new Error('Unsupported file format'));
        }
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  });
};

export const processData = (data: any[]): ProcessedData => {
  if (!data || data.length === 0) {
    return { data: [], columns: [], stats: [], numericColumns: [], categoricalColumns: [] };
  }

  const columns = Object.keys(data[0]);
  const stats: ColumnStats[] = [];
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];

  columns.forEach((col) => {
    const values = data.map((row) => row[col]);
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
    const count = nonNullValues.length;
    const missing = data.length - count;

    let type: ColumnStats['type'] = 'unknown';
    
    // Determine type
    if (count > 0) {
      const sample = nonNullValues[0];
      if (typeof sample === 'number') {
        type = 'numeric';
      } else if (typeof sample === 'boolean') {
        type = 'boolean';
      } else if (sample instanceof Date || !isNaN(Date.parse(String(sample)))) {
        // Simple date check
        if (typeof sample === 'string' && isNaN(Number(sample))) {
           type = 'categorical'; // Default to categorical for strings unless we really want dates
        } else {
           type = 'numeric';
        }
      } else {
        type = 'categorical';
      }
    }

    // Refine type based on all non-null values
    if (type === 'numeric') {
      const allNumeric = nonNullValues.every(v => typeof v === 'number' || !isNaN(Number(v)));
      if (!allNumeric) type = 'categorical';
    }

    const stat: ColumnStats = { name: col, type, count, missing };

    if (type === 'numeric') {
      const nums = nonNullValues.map((v) => Number(v)).filter(n => !isNaN(n));
      if (nums.length > 0) {
        stat.mean = _.mean(nums);
        
        const sorted = [...nums].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        stat.median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        
        stat.min = sorted[0];
        stat.max = sorted[sorted.length - 1];
        numericColumns.push(col);
      } else {
        type = 'categorical';
        stat.type = 'categorical';
      }
    }

    if (type === 'categorical' || type === 'boolean') {
      const counts = _.countBy(nonNullValues);
      const uniqueCount = Object.keys(counts).length;
      stat.uniqueCount = uniqueCount;
      
      stat.topValues = Object.entries(counts)
        .map(([value, c]) => ({ value, count: c as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
        
      categoricalColumns.push(col);
    }

    stats.push(stat);
  });

  return { data, columns, stats, numericColumns, categoricalColumns };
};
