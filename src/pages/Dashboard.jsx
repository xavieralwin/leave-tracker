import { useState, useEffect } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  isSameMonth, isSameDay, addDays, parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, User, Tag } from 'lucide-react';
import { getLeaves, addLeave } from '../api';

const LeaveTypeColors = {
  'CL': 'bg-[#25293c] text-blue-400 border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.15)]',
  'CompOff': 'bg-[#25293c] text-teal-400 border-teal-500/20 shadow-[0_4px_20px_rgba(20,184,166,0.15)]',
  'ML': 'bg-[#25293c] text-purple-400 border-purple-500/20 shadow-[0_4px_20px_rgba(168,85,247,0.15)]',
};

const LeaveTypeGradients = {
  'CL': 'from-blue-500 to-cyan-400',
  'CompOff': 'from-teal-400 to-emerald-500',
  'ML': 'from-purple-500 to-pink-500',
};

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [leaves, setLeaves] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', reason: '', type: 'CL' });
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

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const onDateClick = (day) => setSelectedDate(day);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addLeave(formData);
      setIsModalOpen(false);
      setFormData({ name: '', startDate: '', endDate: '', reason: '', type: 'CL' });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error adding leave", error);
    }
  };

  const isDateInLeave = (date, leave) => {
    const start = parseISO(leave.startDate);
    const end = parseISO(leave.endDate);
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return checkDate >= startDate && checkDate <= endDate;
  };

  const leavesOnSelectedDate = leaves.filter(leave => isDateInLeave(selectedDate, leave));

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
             <CalendarIcon className="w-4 h-4 sm:w-5 h-5 text-white" />
          </div>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-1 bg-[#151722] p-1 rounded-xl border border-white/5 shadow-inner">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-[#25293c] transition-all text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-[#25293c] transition-all text-slate-400 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = "EEEE";
    let startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 py-1.5" key={i}>
          {format(addDays(startDate, i), dateFormat).substring(0, 3)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayLeaves = leaves.filter(l => isDateInLeave(cloneDay, l));
        
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());

        days.push(
          <div
            className={`min-h-[50px] sm:min-h-[75px] p-1 sm:p-1.5 m-0.5 rounded-xl cursor-pointer transition-all duration-300 border ${
              !isCurrentMonth
                ? "bg-transparent border-transparent opacity-20"
                : isSelected
                ? "bg-[#25293c] border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.02]"
                : "bg-[#151722]/50 border-white/5 hover:bg-[#25293c] hover:border-white/10"
            }`}
            key={day}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-semibold ${
                isToday && !isSelected ? 'bg-gradient-to-tr from-blue-500 to-cyan-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                : isSelected ? 'text-blue-400 bg-blue-500/10' 
                : 'text-slate-400'
              }`}>
                {formattedDate}
              </span>
              {dayLeaves.length > 2 && (
                <span className="hidden sm:inline-block text-[9px] font-bold text-slate-300 bg-[#2a2e42] px-1.5 py-0.5 rounded-full border border-white/5">
                  +{dayLeaves.length - 2}
                </span>
              )}
            </div>
            
            {/* Desktop View: Text Chips */}
            <div className="hidden sm:block space-y-1">
              {dayLeaves.slice(0, 2).map((l, idx) => (
                <div 
                  key={idx} 
                  className={`text-[9px] font-medium truncate px-1.5 py-0.5 rounded-md border-l-2 bg-[#1d202f] shadow-sm flex items-center gap-1
                    ${l.type === 'CL' ? 'border-l-blue-500 text-blue-300' : 
                      l.type === 'CompOff' ? 'border-l-teal-500 text-teal-300' : 
                      'border-l-purple-500 text-purple-300'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${LeaveTypeGradients[l.type]} shrink-0`} />
                  <span className="truncate">{l.name}</span>
                </div>
              ))}
            </div>

            {/* Mobile View: Dots */}
            <div className="flex sm:hidden flex-wrap gap-1 justify-center mt-1">
              {dayLeaves.map((l, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${LeaveTypeGradients[l.type]} shadow-sm`}
                  title={`${l.name} (${l.type})`}
                />
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      
      {/* Calendar Section */}
      <div className="xl:col-span-3 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Team Overview</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Manage and track your team's leaves</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Record
          </button>
        </div>
        
        <div className="glass-panel p-4 sm:p-6">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
      </div>

      {/* Details Section */}
      <div className="xl:col-span-1 flex flex-col h-auto xl:h-[calc(100vh-8rem)]">
        <div className="glass-panel p-5 flex-1 flex flex-col xl:sticky xl:top-8">
          <div className="text-center mb-6 pb-5 border-b border-white/5">
            <h3 className="text-lg font-black text-white tracking-tight">
              {format(selectedDate, 'MMM do, yyyy')}
            </h3>
            <p className="text-xs font-medium text-slate-400 mt-1">
              {format(selectedDate, 'EEEE')}
            </p>
            <div className="mt-4 inline-flex items-center justify-center px-3 py-1 bg-[#151722] rounded-full border border-white/5 shadow-inner">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                {leavesOnSelectedDate.length} {leavesOnSelectedDate.length === 1 ? 'member' : 'members'} away
              </span>
            </div>
          </div>
          
          <div className="flex-1 xl:overflow-y-auto space-y-3 pr-1 custom-scrollbar max-h-[300px] xl:max-h-none overflow-y-auto">
            {leavesOnSelectedDate.length > 0 ? (
              leavesOnSelectedDate.map(leave => (
                <div key={leave.id} className={`p-3 rounded-2xl border transition-all hover:scale-[1.02] ${LeaveTypeColors[leave.type]}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center text-sm font-bold text-white">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-2 text-white bg-gradient-to-br ${LeaveTypeGradients[leave.type]} shadow-sm`}>
                        {leave.name.charAt(0).toUpperCase()}
                      </div>
                      {leave.name}
                    </div>
                  </div>
                  <div className="pl-9 space-y-1.5">
                    {leave.startDate !== leave.endDate && (
                      <div className="text-[10px] font-medium opacity-80 flex items-center">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {format(parseISO(leave.startDate), 'MMM d')} - {format(parseISO(leave.endDate), 'MMM d')}
                      </div>
                    )}
                    <div className="text-[11px] opacity-90 flex items-start leading-snug">
                      <Tag className="w-3 h-3 mr-1.5 mt-0.5 shrink-0 opacity-70" />
                      {leave.reason || 'No reason provided'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 px-2 flex flex-col items-center justify-center h-full opacity-60">
                <div className="w-16 h-16 bg-[#25293c] rounded-2xl rotate-3 flex items-center justify-center mb-4 border border-white/5 shadow-lg">
                  <User className="w-7 h-7 text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-300">Full Force Today</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Everyone is available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0c10]/80 backdrop-blur-sm p-4">
          <div className="bg-[#1d202f] rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/10">
            <div className="px-6 py-5 flex justify-between items-center border-b border-white/5 bg-[#151722]/50">
              <h3 className="text-base font-black text-white flex items-center">
                <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mr-3 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  <Plus className="w-4 h-4" />
                </span>
                New Leave
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#25293c] text-slate-400 hover:bg-[#2a2e42] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Employee Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="input-field [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">End Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="input-field [color-scheme:dark]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Leave Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['CL', 'CompOff', 'ML'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({...formData, type})}
                      className={`py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wide transition-all ${
                        formData.type === type 
                        ? 'border-blue-500 bg-gradient-to-r from-blue-500/20 to-cyan-400/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                        : 'border-white/10 text-slate-400 bg-[#151722] hover:bg-[#25293c] hover:border-white/20'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Reason (Optional)</label>
                <textarea 
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="input-field resize-none min-h-[80px]"
                  placeholder="Why are they away?"
                />
              </div>
              
              <div className="pt-2 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:bg-[#25293c] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary px-6"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
