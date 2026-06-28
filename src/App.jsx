import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import YearlySummary from './pages/YearlySummary';

function Layout({ children }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const navItems = [
    { name: 'Calendar Dashboard', path: '/', icon: <Calendar className="w-5 h-5 mr-3" /> },
    { name: 'Yearly Summary', path: '/yearly-summary', icon: <Users className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#151722] font-sans text-slate-200 overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex h-16 items-center justify-between px-6 bg-[#1d202f] border-b border-white/5 z-20 shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-black text-base mr-2.5 shadow-[0_0_10px_rgba(59,130,246,0.4)]">
            L
          </div>
          <h1 className="text-lg font-black text-white tracking-tight">
            Leave Tracker
          </h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -mr-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#1d202f] border-r border-white/5 flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-black text-xl mr-3 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            L
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Leave Tracker
          </h1>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group font-bold text-sm
                  ${isActive 
                    ? 'bg-blue-500/10 text-blue-400 shadow-[inset_2px_0_0_rgba(59,130,246,1)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
              >
                <div className={`${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5 text-[11px] font-medium text-slate-500 text-center uppercase tracking-wider">
          Team Leave Tracker © 2026
        </div>
      </aside>

      {/* Mobile Drawer (visible only on mobile when opened) */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      {/* Drawer container */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#1d202f] z-50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.4)] md:hidden transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-black text-base mr-2.5 shadow-[0_0_10px_rgba(59,130,246,0.4)]">
              L
            </div>
            <h1 className="text-lg font-black text-white tracking-tight">
              Leave Tracker
            </h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group font-bold text-sm
                  ${isActive 
                    ? 'bg-blue-500/10 text-blue-400 shadow-[inset_2px_0_0_rgba(59,130,246,1)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
              >
                <div className={`${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5 text-[11px] font-medium text-slate-500 text-center uppercase tracking-wider">
          Team Leave Tracker © 2026
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#151722] relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/10 to-transparent" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative p-4 md:p-6 h-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/yearly-summary" element={<YearlySummary />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
