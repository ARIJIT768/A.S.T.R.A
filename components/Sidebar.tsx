import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-6 hidden lg:block">
      <div className="space-y-8">
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu</h3>
          <nav className="space-y-2">
            <a href="#" className="block px-4 py-2 rounded-lg bg-blue-600 text-white font-medium transition">
              🏠 Dashboard
            </a>
            <a href="#" className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">
              📅 Appointments
            </a>
            <a href="#" className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">
              🩺 Medical Records
            </a>
            <a href="#" className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">
              💊 Prescriptions
            </a>
            <a href="#" className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">
              👥 Doctors
            </a>
            <a href="#" className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">
              🏥 Clinics
            </a>
          </nav>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Settings</h3>
          <nav className="space-y-2">
            <a href="#" className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">
              ⚙️ Settings
            </a>
            <a href="#" className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">
              ❓ Help & Support
            </a>
            <a href="#" className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">
              🚪 Logout
            </a>
          </nav>
        </div>
      </div>
    </aside>
  );
}
