import React from 'react';

export default function Dashboard() {
  return (
    <main className="flex-1 overflow-auto bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, John</h1>
          <p className="text-slate-600 mt-2">Here's your health overview for today</p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon="❤️" 
            title="Heart Rate" 
            value="72" 
            unit="bpm" 
            status="Normal"
            color="bg-red-50"
            textColor="text-red-600"
          />
          <StatCard 
            icon="🌡️" 
            title="Temperature" 
            value="98.6" 
            unit="°F" 
            status="Normal"
            color="bg-orange-50"
            textColor="text-orange-600"
          />
          <StatCard 
            icon="🩸" 
            title="Blood Pressure" 
            value="120/80" 
            unit="mmHg" 
            status="Normal"
            color="bg-blue-50"
            textColor="text-blue-600"
          />
          <StatCard 
            icon="⚖️" 
            title="Weight" 
            value="72" 
            unit="kg" 
            status="Healthy"
            color="bg-green-50"
            textColor="text-green-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Upcoming Appointments</h2>
            <div className="space-y-4">
              <AppointmentCard
                doctor="Dr. Sarah Johnson"
                specialty="Cardiologist"
                date="Tomorrow"
                time="10:00 AM"
                status="Confirmed"
              />
              <AppointmentCard
                doctor="Dr. Michael Chen"
                specialty="General Practitioner"
                date="March 15, 2026"
                time="2:30 PM"
                status="Scheduled"
              />
              <AppointmentCard
                doctor="Dr. Emily Rodriguez"
                specialty="Dermatologist"
                date="March 22, 2026"
                time="3:00 PM"
                status="Pending"
              />
            </div>
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
              View All Appointments
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium">
                📋 Book Appointment
              </button>
              <button className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium">
                💊 View Prescriptions
              </button>
              <button className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium">
                📄 My Records
              </button>
              <button className="w-full text-left px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition font-medium">
                📞 Contact Support
              </button>
            </div>
          </div>
        </div>

        {/* Recent Lab Results */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Lab Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Test Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Result</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Reference Range</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">Blood Glucose</td>
                  <td className="py-3 px-4">95 mg/dL</td>
                  <td className="py-3 px-4">70-100 mg/dL</td>
                  <td className="py-3 px-4">March 5, 2026</td>
                  <td className="py-3 px-4"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Normal</span></td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">Cholesterol</td>
                  <td className="py-3 px-4">180 mg/dL</td>
                  <td className="py-3 px-4">&lt;200 mg/dL</td>
                  <td className="py-3 px-4">March 5, 2026</td>
                  <td className="py-3 px-4"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Normal</span></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4">Hemoglobin</td>
                  <td className="py-3 px-4">14.5 g/dL</td>
                  <td className="py-3 px-4">13.5-17.5 g/dL</td>
                  <td className="py-3 px-4">March 1, 2026</td>
                  <td className="py-3 px-4"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Normal</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, title, value, unit, status, color, textColor }: 
  { icon: string; title: string; value: string; unit: string; status: string; color: string; textColor: string }) {
  return (
    <div className={`${color} rounded-lg p-6 border border-slate-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 font-medium text-sm">{title}</p>
          <div className="mt-2">
            <span className={`text-3xl font-bold ${textColor}`}>{value}</span>
            <span className={`${textColor} text-sm ml-1`}>{unit}</span>
          </div>
          <p className="text-slate-500 text-xs mt-2">{status}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

function AppointmentCard({ doctor, specialty, date, time, status }: 
  { doctor: string; specialty: string; date: string; time: string; status: string }) {
  const statusColor = status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                      status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-blue-100 text-blue-700';
  
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div>
        <p className="font-semibold text-slate-900">{doctor}</p>
        <p className="text-sm text-slate-600">{specialty}</p>
        <p className="text-sm text-slate-500 mt-1">{date} at {time}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
        {status}
      </span>
    </div>
  );
}
