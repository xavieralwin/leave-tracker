import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { verifyPassword, setUnlocked, getStoredPassword } from '../api';

export default function LockScreen({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    if (verifyPassword(password.trim())) {
      setUnlocked(rememberMe);
      onUnlock();
    } else {
      setErrorMessage('Incorrect password. Please try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0e1017] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Lock Box */}
      <div 
        className={`w-full max-w-md bg-[#181b27]/95 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8 relative z-10 transition-all duration-300 ${
          isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''
        }`}
      >
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 p-[2px] shadow-[0_0_30px_rgba(59,130,246,0.35)] mb-4">
            <div className="w-full h-full bg-[#151722] rounded-[22px] flex items-center justify-center">
              <Lock className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            </div>
          </div>
          
          <h1 className="text-2xl font-black text-white tracking-tight">
            Leave Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Please enter the password to view the site
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2.5 text-xs text-red-300 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Site Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter password..."
                className="w-full px-4 py-3.5 pl-11 pr-12 bg-[#12141d] text-white border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-sm placeholder-slate-500 transition-all font-medium"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/10 bg-[#12141d] text-blue-500 focus:ring-blue-500/40 w-4 h-4"
              />
              <span>Remember on this browser</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 bg-[length:200%_auto] hover:bg-right transition-all duration-300 text-white font-bold text-sm shadow-[0_0_25px_rgba(59,130,246,0.35)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            <span>Enter Site</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-500">
            Default password: <span className="font-mono text-slate-400 bg-[#12141d] px-1.5 py-0.5 rounded border border-white/5 font-semibold">admin</span>
          </p>
        </div>
      </div>
    </div>
  );
}
