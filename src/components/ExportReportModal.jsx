import React, { useState, useMemo } from 'react';
import { 
  format, parseISO, addDays, isValid, startOfYear, endOfYear, 
  startOfMonth, endOfMonth, subDays, isWithinInterval
} from 'date-fns';
import { 
  X, Download, FileSpreadsheet, Printer, Calendar, User, Filter, 
  CheckCircle2, FileText, Sparkles, Clock, ArrowRight
} from 'lucide-react';

export default function ExportReportModal({ isOpen, onClose, leaves = [], defaultYear }) {
  const today = new Date();
  const currentYear = defaultYear || today.getFullYear();
  
  // Person & Date Range States
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [fromDate, setFromDate] = useState(format(startOfYear(new Date(currentYear, 0, 1)), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(endOfYear(new Date(currentYear, 0, 1)), 'yyyy-MM-dd'));
  const [selectedLeaveType, setSelectedLeaveType] = useState('all');
  const [reportFormat, setReportFormat] = useState('date-range'); // 'date-range' | 'day-by-day' | 'summary'

  // Distinct Employee Names
  const employeeNames = useMemo(() => {
    const names = Array.from(new Set(leaves.map(l => l.name?.trim()).filter(Boolean)));
    return names.sort((a, b) => a.localeCompare(b));
  }, [leaves]);

  const leaveTypes = ['CL', 'CompOff', 'ML', 'WFH'];

  // Helper for duration
  const getDuration = (startStr, endStr) => {
    try {
      const start = parseISO(startStr);
      const end = parseISO(endStr);
      if (!isValid(start) || !isValid(end)) return 1;
      const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  // Helper to list all individual dates in a range
  const getDatesListString = (startStr, endStr) => {
    try {
      const start = parseISO(startStr);
      const end = parseISO(endStr);
      if (!isValid(start) || !isValid(end)) return startStr;
      
      const dates = [];
      let curr = start;
      while (curr <= end) {
        dates.push(format(curr, 'yyyy-MM-dd'));
        curr = addDays(curr, 1);
      }
      return dates.join(', ');
    } catch {
      return startStr;
    }
  };

  // Quick Preset Handlers
  const applyPreset = (preset) => {
    const now = new Date();
    if (preset === 'this-year') {
      setFromDate(format(startOfYear(now), 'yyyy-MM-dd'));
      setToDate(format(endOfYear(now), 'yyyy-MM-dd'));
    } else if (preset === 'this-month') {
      setFromDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setToDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    } else if (preset === 'last-30') {
      setFromDate(format(subDays(now, 30), 'yyyy-MM-dd'));
      setToDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === 'last-90') {
      setFromDate(format(subDays(now, 90), 'yyyy-MM-dd'));
      setToDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === 'all-time') {
      setFromDate('2020-01-01');
      setToDate('2030-12-31');
    }
  };

  // Filter leaves based on Person, From Date, To Date, and Type
  const filteredLeaves = useMemo(() => {
    return leaves.filter(leave => {
      // 1. Employee filter
      if (selectedPerson !== 'all' && leave.name !== selectedPerson) {
        return false;
      }

      // 2. Type filter
      if (selectedLeaveType !== 'all' && leave.type !== selectedLeaveType) {
        return false;
      }

      // 3. Date Range (From Date to To Date overlap)
      try {
        const leaveStart = parseISO(leave.startDate);
        const leaveEnd = parseISO(leave.endDate);
        const rangeStart = parseISO(fromDate);
        const rangeEnd = parseISO(toDate);

        if (!isValid(leaveStart) || !isValid(leaveEnd)) return false;
        if (isValid(rangeStart) && isValid(rangeEnd)) {
          // Check if leave overlaps with [rangeStart, rangeEnd]
          return leaveStart <= rangeEnd && leaveEnd >= rangeStart;
        }
      } catch {
        return false;
      }

      return true;
    });
  }, [leaves, selectedPerson, fromDate, toDate, selectedLeaveType]);

  // Day-by-Day individual entries within the date range
  const dayWiseRecords = useMemo(() => {
    const records = [];
    const rangeStart = parseISO(fromDate);
    const rangeEnd = parseISO(toDate);

    filteredLeaves.forEach(leave => {
      try {
        const start = parseISO(leave.startDate);
        const end = parseISO(leave.endDate);
        if (!isValid(start) || !isValid(end)) return;

        let curr = start;
        while (curr <= end) {
          let inRange = true;
          if (isValid(rangeStart) && isValid(rangeEnd)) {
            inRange = curr >= rangeStart && curr <= rangeEnd;
          }

          if (inRange) {
            records.push({
              id: `${leave.id}-${format(curr, 'yyyyMMdd')}`,
              name: leave.name,
              date: format(curr, 'yyyy-MM-dd'),
              dayOfWeek: format(curr, 'EEEE'),
              type: leave.type,
              reason: leave.reason || '-',
              leaveFrom: leave.startDate,
              leaveTo: leave.endDate
            });
          }
          curr = addDays(curr, 1);
        }
      } catch (err) {
        console.error(err);
      }
    });

    return records.sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredLeaves, fromDate, toDate]);

  // Summary aggregation
  const summaryRecords = useMemo(() => {
    const map = {};
    filteredLeaves.forEach(leave => {
      if (!map[leave.name]) {
        map[leave.name] = { name: leave.name, CL: 0, CompOff: 0, ML: 0, WFH: 0, Total: 0 };
      }
      const dur = getDuration(leave.startDate, leave.endDate);
      if (leave.type === 'CL') map[leave.name].CL += dur;
      else if (leave.type === 'CompOff') map[leave.name].CompOff += dur;
      else if (leave.type === 'ML') map[leave.name].ML += dur;
      else if (leave.type === 'WFH') map[leave.name].WFH += dur;
      map[leave.name].Total += dur;
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredLeaves]);

  const totalLeaveDaysCount = useMemo(() => {
    return filteredLeaves.reduce((acc, l) => acc + getDuration(l.startDate, l.endDate), 0);
  }, [filteredLeaves]);

  if (!isOpen) return null;

  // Download CSV Handler
  const downloadCSV = () => {
    let headers = [];
    let rows = [];
    const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
    const personSlug = selectedPerson === 'all' ? 'all_members' : selectedPerson.replace(/\s+/g, '_').toLowerCase();
    let filename = `leave_report_${personSlug}_${fromDate}_to_${toDate}_${timestamp}.csv`;

    if (reportFormat === 'date-range') {
      headers = ['Employee Name', 'From Date', 'To Date', 'Total Days', 'Leave Type', 'Reason', 'Dates on Leave'];
      rows = filteredLeaves.map(l => [
        l.name,
        l.startDate,
        l.endDate,
        getDuration(l.startDate, l.endDate),
        l.type,
        l.reason || '',
        getDatesListString(l.startDate, l.endDate)
      ]);
    } else if (reportFormat === 'day-by-day') {
      filename = `daywise_leaves_${personSlug}_${fromDate}_to_${toDate}_${timestamp}.csv`;
      headers = ['Leave Date', 'Day of Week', 'Employee Name', 'Leave Type', 'Leave From Date', 'Leave To Date', 'Reason'];
      rows = dayWiseRecords.map(r => [
        r.date,
        r.dayOfWeek,
        r.name,
        r.type,
        r.leaveFrom,
        r.leaveTo,
        r.reason
      ]);
    } else {
      filename = `leave_summary_${personSlug}_${fromDate}_to_${toDate}_${timestamp}.csv`;
      headers = ['Employee Name', 'Casual Leave (CL)', 'Comp Off', 'Medical Leave (ML)', 'WFH', 'Total Days'];
      rows = summaryRecords.map(s => [
        s.name,
        s.CL,
        s.CompOff,
        s.ML,
        s.WFH,
        s.Total
      ]);
    }

    const csvBody = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          if (val === null || val === undefined) return '""';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return `"${str}"`;
        }).join(',')
      )
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print / PDF View Handler
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const personTitle = selectedPerson === 'all' ? 'All Team Members' : selectedPerson;
    const titleText = `Leave Report: ${personTitle} (${fromDate} to ${toDate})`;

    let tableHTML = '';
    if (reportFormat === 'date-range') {
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>From Date</th>
              <th>To Date</th>
              <th style="text-align:center;">Days</th>
              <th>Type</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLeaves.map(l => `
              <tr>
                <td><strong>${l.name}</strong></td>
                <td>${l.startDate}</td>
                <td>${l.endDate}</td>
                <td style="text-align:center; font-weight:bold; color:#2563eb;">${getDuration(l.startDate, l.endDate)}</td>
                <td><span class="badge ${l.type}">${l.type}</span></td>
                <td>${l.reason || '<em style="color:#94a3b8;">None</em>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportFormat === 'day-by-day') {
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Employee Name</th>
              <th>Type</th>
              <th>Leave Period</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${dayWiseRecords.map(r => `
              <tr>
                <td><strong>${r.date}</strong></td>
                <td>${r.dayOfWeek}</td>
                <td>${r.name}</td>
                <td><span class="badge ${r.type}">${r.type}</span></td>
                <td>${r.leaveFrom} → ${r.leaveTo}</td>
                <td>${r.reason}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th style="text-align:center;">Casual (CL)</th>
              <th style="text-align:center;">Comp Off</th>
              <th style="text-align:center;">Medical (ML)</th>
              <th style="text-align:center;">WFH</th>
              <th style="text-align:center;">Total Days</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRecords.map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td style="text-align:center;">${s.CL}</td>
                <td style="text-align:center;">${s.CompOff}</td>
                <td style="text-align:center;">${s.ML}</td>
                <td style="text-align:center;">${s.WFH}</td>
                <td style="text-align:center; font-weight:bold; color:#2563eb;">${s.Total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${titleText}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
            h1 { margin: 0 0 4px 0; color: #0f172a; font-size: 22px; }
            .subtitle { color: #64748b; font-size: 13px; margin-bottom: 20px; }
            .meta-bar { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th { background-color: #f1f5f9; color: #334155; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) td { background-color: #f8fafc; }
            .badge { padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
            .badge.CL { background: #dbeafe; color: #1d4ed8; }
            .badge.CompOff { background: #ccfbf1; color: #0f766e; }
            .badge.ML { background: #f3e8ff; color: #7e22ce; }
            .badge.WFH { background: #ffedd5; color: #c2410c; }
            @media print {
              body { padding: 0; }
              .meta-bar { border-color: #ccc; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <h1>Leave Report</h1>
          <div class="subtitle">Generated on ${format(new Date(), 'MMMM d, yyyy h:mm a')}</div>
          <div class="meta-bar">
            <div>Person: <strong>${personTitle}</strong></div>
            <div>Date Range: <strong>${fromDate} to ${toDate}</strong></div>
            <div>Total Leaves: <strong>${filteredLeaves.length} records (${totalLeaveDaysCount} days)</strong></div>
          </div>
          ${tableHTML}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0c10]/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#1d202f] border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center border-b border-white/5 bg-[#151722]/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Download Leave Report</h3>
              <p className="text-xs text-slate-400">Get person leave records with exact From Date and To Date</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#25293c] text-slate-400 hover:bg-[#2a2e42] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          
          {/* Section 1: Person & Date Range (From Date to To Date) */}
          <div className="bg-[#151722]/80 p-5 rounded-2xl border border-white/5 space-y-4">
            
            {/* Person & Leave Type Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Select Person / Employee
                </label>
                <select 
                  value={selectedPerson}
                  onChange={e => setSelectedPerson(e.target.value)}
                  className="input-field py-2.5 text-sm font-semibold"
                >
                  <option value="all">All Team Members ({employeeNames.length})</option>
                  {employeeNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  Leave Type
                </label>
                <select 
                  value={selectedLeaveType}
                  onChange={e => setSelectedLeaveType(e.target.value)}
                  className="input-field py-2.5 text-sm font-semibold"
                >
                  <option value="all">All Leave Types (CL, CompOff, ML, WFH)</option>
                  {leaveTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range: From Date to To Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Leave Date Range (From Date → To Date)
                </label>
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1">
                  <button 
                    type="button" 
                    onClick={() => applyPreset('this-month')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#25293c] text-slate-300 hover:text-white hover:bg-blue-500/20 border border-white/5 transition-colors"
                  >
                    This Month
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPreset('this-year')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#25293c] text-slate-300 hover:text-white hover:bg-blue-500/20 border border-white/5 transition-colors"
                  >
                    This Year
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPreset('last-30')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#25293c] text-slate-300 hover:text-white hover:bg-blue-500/20 border border-white/5 transition-colors"
                  >
                    Last 30 Days
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPreset('all-time')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#25293c] text-slate-300 hover:text-white hover:bg-blue-500/20 border border-white/5 transition-colors"
                  >
                    All Time
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[11px] font-bold text-slate-500 uppercase">From</span>
                  <input 
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="input-field pl-14 py-2 text-sm [color-scheme:dark] font-bold text-white"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[11px] font-bold text-slate-500 uppercase">To</span>
                  <input 
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="input-field pl-10 py-2 text-sm [color-scheme:dark] font-bold text-white"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Report Format Style */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Report View Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setReportFormat('date-range')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reportFormat === 'date-range'
                    ? 'border-blue-500 bg-blue-500/15 shadow-[0_0_15px_rgba(59,130,246,0.2)] text-white'
                    : 'border-white/5 bg-[#151722] text-slate-400 hover:text-slate-200 hover:bg-[#25293c]'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between mb-1">
                  <span>Person Leaves (From-To)</span>
                  {reportFormat === 'date-range' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Each row shows Person, From Date, To Date, Days, Type, and Reason.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportFormat('day-by-day')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reportFormat === 'day-by-day'
                    ? 'border-cyan-500 bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-white'
                    : 'border-white/5 bg-[#151722] text-slate-400 hover:text-slate-200 hover:bg-[#25293c]'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between mb-1">
                  <span>Day-by-Day Log</span>
                  {reportFormat === 'day-by-day' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  One row for every single calendar day the person was away.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportFormat('summary')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reportFormat === 'summary'
                    ? 'border-purple-500 bg-purple-500/15 shadow-[0_0_15px_rgba(168,85,247,0.2)] text-white'
                    : 'border-white/5 bg-[#151722] text-slate-400 hover:text-slate-200 hover:bg-[#25293c]'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between mb-1">
                  <span>Summary Totals</span>
                  {reportFormat === 'summary' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Total days breakdown per employee by leave type.
                </p>
              </button>
            </div>
          </div>

          {/* Section 3: Live Preview of Matching Records */}
          <div className="p-4 rounded-2xl bg-[#25293c]/50 border border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Leaves Found:</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                  {filteredLeaves.length} records
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Total Leave Duration:</span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                  {totalLeaveDaysCount} days
                </span>
              </div>
            </div>

            {/* Preview Table */}
            <div className="max-h-44 overflow-y-auto custom-scrollbar rounded-xl border border-white/5 bg-[#151722]/90">
              {filteredLeaves.length > 0 ? (
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-[#1d202f] sticky top-0 text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="py-2.5 px-3">Person</th>
                      <th className="py-2.5 px-3">From Date</th>
                      <th className="py-2.5 px-3">To Date</th>
                      <th className="py-2.5 px-3 text-center">Days</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredLeaves.map((l, i) => (
                      <tr key={l.id || i} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-[9px] text-white font-black">
                            {l.name.charAt(0).toUpperCase()}
                          </div>
                          {l.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-cyan-300">{l.startDate}</td>
                        <td className="py-2.5 px-3 font-mono text-cyan-300">{l.endDate}</td>
                        <td className="py-2.5 px-3 text-center font-black text-blue-400">
                          {getDuration(l.startDate, l.endDate)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#25293c] text-slate-300 border border-white/5">
                            {l.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[130px]">
                          {l.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No leave records found for <strong className="text-slate-400">{selectedPerson === 'all' ? 'any team member' : selectedPerson}</strong> between <strong className="text-slate-400">{fromDate}</strong> and <strong className="text-slate-400">{toDate}</strong>.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-white/5 bg-[#151722]/90 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-[#25293c] hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredLeaves.length === 0}
              className="flex-1 sm:flex-initial btn-secondary flex items-center justify-center text-xs py-2.5 px-4 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Print / PDF
            </button>

            <button
              type="button"
              onClick={downloadCSV}
              disabled={filteredLeaves.length === 0}
              className="flex-1 sm:flex-initial btn-primary flex items-center justify-center text-xs py-2.5 px-5 disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Report (CSV)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
