import React from 'react';

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-xl font-bold text-slate-900">MediCare</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-slate-600 hover:text-slate-900 transition">Dashboard</a>
          <a href="#" className="text-slate-600 hover:text-slate-900 transition">Appointments</a>
          <a href="#" className="text-slate-600 hover:text-slate-900 transition">Records</a>
          <a href="#" className="text-slate-600 hover:text-slate-900 transition">Prescriptions</a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center font-semibold text-blue-700">
            JD
          </button>
        </div>
      </div>
    </header>
  );
}
