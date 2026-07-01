import { useState, useEffect } from 'react';
import { getLeaves, deleteLeave } from '../api';
import { parseISO } from 'date-fns';
import { Download, Search, Trash2, Calendar } from 'lucide-react';

export default function YearlySummary() {
  const [leaves, setLeaves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let mounted = true;
    getLeaves().then(data => {
      if (mounted) {
        setLeaves(data);
      }
    }).catch(err => {
      console.error("Error fetching leaves", err);
    });
    return () => { mounted = false; };
  }, [refreshTrigger]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave record?')) {
      try {
        await deleteLeave(id);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error("Error deleting leave", error);
      }
    }
  };

  const getLeaveDuration = (startStr, endStr) => {
    const start = parseISO(startStr);
    const end = parseISO(endStr);
    return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const processSummaryData = () => {
    const summary = {};
    
    const filteredLeaves = leaves.filter(l => {
      const startYear = parseISO(l.startDate).getFullYear();
      const endYear = parseISO(l.endDate).getFullYear();
      return startYear === selectedYear || endYear === selectedYear;
    });

    filteredLeaves.forEach(leave => {
      if (!summary[leave.name]) {
        summary[leave.name] = { CL: 0, CompOff: 0, ML: 0, WFH: 0, Total: 0 };
      }
      
      const duration = getLeaveDuration(leave.startDate, leave.endDate);
      
      if (leave.type === 'CL') summary[leave.name].CL += duration;
      else if (leave.type === 'CompOff') summary[leave.name].CompOff += duration;
      else if (leave.type === 'ML') summary[leave.name].ML += duration;
      else if (leave.type === 'WFH') summary[leave.name].WFH += duration;
      
      summary[leave.name].Total += duration;
    });

    return Object.entries(summary).map(([name, stats]) => ({
      name,
      ...stats
    })).filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const summaryData = processSummaryData();

  const handleExportCSV = () => {
    const headers = ['Employee Name', 'Casual (CL)', 'Comp Off', 'Medical (ML)', 'WFH', 'Total'];
    const rows = summaryData.map(row => [
      row.name,
      row.CL,
      row.CompOff,
      row.ML,
      row.WFH,
      row.Total
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => {
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leave_summary_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - 2 + i);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Yearly Summary</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Leave balances and history for {selectedYear}</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select 
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="appearance-none input-field py-2.5 pr-10 font-bold text-white bg-[#1d202f] border-white/10 shadow-lg shadow-black/20 w-full"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <button 
            onClick={handleExportCSV}
            className="btn-secondary flex items-center justify-center shadow-lg shadow-black/20 bg-[#1d202f] flex-1 sm:flex-initial"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* Summary Table */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col h-auto lg:h-[calc(100vh-10rem)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-xl font-bold text-white">Team Members</h3>
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input-field pl-9 py-2 text-sm w-full sm:w-64 bg-[#151722] border-white/5"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto overflow-y-auto rounded-xl border border-white/5 bg-[#151722]/50 custom-scrollbar w-full">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-[#1d202f] sticky top-0 border-b border-white/5 z-10 shadow-sm">
                <tr>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-slate-400">Employee Name</th>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-slate-400 text-center">Casual (CL)</th>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-slate-400 text-center">Comp Off</th>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-slate-400 text-center">Medical (ML)</th>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-slate-400 text-center">WFH</th>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-blue-400 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summaryData.length > 0 ? summaryData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-6 font-medium text-slate-200 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-bold flex items-center justify-center mr-3 text-xs shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                        {row.name.charAt(0).toUpperCase()}
                      </div>
                      {row.name}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-sm font-bold border border-blue-500/20">{row.CL}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-teal-500/10 text-teal-400 px-3 py-1 rounded-lg text-sm font-bold border border-teal-500/20">{row.CompOff}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg text-sm font-bold border border-purple-500/20">{row.ML}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-lg text-sm font-bold border border-orange-500/20">{row.WFH}</span>
                    </td>
                    <td className="py-4 px-6 text-center font-black text-white text-lg">
                      {row.Total}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">
                      No data found for the selected year.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Leave History */}
        <div className="lg:col-span-1 glass-panel p-6 flex flex-col h-auto lg:h-[calc(100vh-10rem)]">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            Recent Records
          </h3>
          <div className="flex-1 lg:overflow-y-auto pr-2 space-y-4 custom-scrollbar max-h-[400px] lg:max-h-none overflow-y-auto">
            {leaves.slice().reverse().map(leave => (
              <div key={leave.id} className="p-4 rounded-xl border border-white/5 bg-[#25293c]/50 hover:bg-[#25293c] transition-all group relative hover:border-white/10 hover:shadow-lg">
                <button 
                  onClick={() => handleDelete(leave.id)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100 opacity-100 transition-opacity bg-[#151722] p-1.5 rounded-lg"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-white">{leave.name}</div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#151722] text-slate-400 border border-white/5">{leave.type}</span>
                </div>
                <div className="text-xs text-slate-400 mb-2 font-medium">
                  {leave.startDate} {leave.startDate !== leave.endDate && <span className="text-slate-500 mx-1">→</span>} {leave.startDate !== leave.endDate && leave.endDate}
                </div>
                {leave.reason && (
                  <div className="text-xs text-slate-500 italic bg-[#151722]/50 p-2 rounded-lg border border-white/5 mt-2">"{leave.reason}"</div>
                )}
              </div>
            ))}
            {leaves.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#25293c] flex items-center justify-center mb-3 border border-white/5">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                No leave records added yet.
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
