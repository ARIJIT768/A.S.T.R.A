'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading, healthData, fetchHealthData, logout } = useAuth();
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          await fetchHealthData();
        } finally {
          setLoadingData(false);
        }
      };
      loadData();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get latest temperature
  const latestTemp = healthData.length > 0 ? healthData[0].temperature : null;
  const latestBpm = healthData.length > 0 ? healthData[0].bpm : null;
  const latestSpO2 = healthData.length > 0 ? healthData[0].spO2 : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-green-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob -z-10"></div>
      <div className="fixed top-0 right-0 w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 -z-10"></div>
      <div className="fixed bottom-0 left-1/2 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 -z-10"></div>

      {/* Header */}
      <header className="backdrop-blur-md bg-slate-800/50 border-b border-slate-700/50 shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">A.S.T.R.A</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 font-medium text-sm transform hover:scale-105 active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 relative z-10">
        {/* User Profile Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-2xl p-8 mb-8 backdrop-blur-sm border border-green-700/30 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <p className="text-green-100 text-sm mb-2 font-medium">Full Name</p>
              <p className="text-2xl font-bold">{user.name}</p>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <p className="text-green-100 text-sm mb-2 font-medium">Age</p>
              <p className="text-2xl font-bold">{user.age} years</p>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <p className="text-green-100 text-sm mb-2 font-medium">Gender</p>
              <p className="text-2xl font-bold capitalize">{user.gender}</p>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <p className="text-green-100 text-sm mb-2 font-medium">Member Since</p>
              <p className="text-lg font-bold">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Health Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Current Temperature */}
          <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 font-medium text-sm">Temperature</p>
                {latestTemp !== null ? (
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mt-2">{latestTemp}°C</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {healthData.length > 0 && `${new Date(healthData[0].timestamp).toLocaleTimeString()}`}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500 mt-2">No data yet</p>
                )}
              </div>
              <div className="text-4xl animate-float">🌡️</div>
            </div>
          </div>

          {/* Heart Rate / BPM */}
          <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 font-medium text-sm">Heart Rate</p>
                {latestBpm !== null ? (
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent mt-2">{latestBpm}</p>
                    <p className="text-xs text-slate-500 mt-1">BPM</p>
                  </div>
                ) : (
                  <p className="text-slate-500 mt-2">No data yet</p>
                )}
              </div>
              <div className="text-4xl animate-float">💓</div>
            </div>
          </div>

          {/* Blood Oxygen / SpO2 */}
          <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 font-medium text-sm">Blood Oxygen</p>
                {latestSpO2 !== null ? (
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-500 bg-clip-text text-transparent mt-2">{latestSpO2}%</p>
                    <p className="text-xs text-slate-500 mt-1">SpO2</p>
                  </div>
                ) : (
                  <p className="text-slate-500 mt-2">No data yet</p>
                )}
              </div>
              <div className="text-4xl animate-float">💚</div>
            </div>
          </div>

          {/* Total Readings */}
          <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 font-medium text-sm">Total Readings</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mt-2">{healthData.length}</p>
                <p className="text-xs text-slate-500 mt-1">health records</p>
              </div>
              <div className="text-4xl animate-float">📊</div>
            </div>
          </div>
        </div>

        {/* Health Readings & AI Responses */}
        <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700/50 backdrop-blur-sm overflow-hidden animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="border-b border-slate-700 p-6 bg-gradient-to-r from-slate-800/50 to-slate-800/30">
            <h2 className="text-2xl font-bold text-white">Health Readings & AI Analysis</h2>
            <p className="text-slate-400 text-sm mt-1">Your vital signs with AI insights</p>
          </div>

          {healthData.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 font-medium">No health readings yet</p>
              <p className="text-sm text-slate-500 mt-2">Connect your ESP32 device to start tracking. Temperature, heart rate, and oxygen saturation data with AI analysis will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {healthData.map((reading, index) => (
                <div key={reading.id} className="p-6 hover:bg-slate-700/30 transition-all duration-300 transform hover:scale-[1.01]">
                  <div className="flex items-start justify-between mb-4 flex-col sm:flex-row gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="inline-block w-10 h-10 bg-blue-900/50 text-blue-400 rounded-full flex items-center justify-center font-semibold text-sm border border-blue-800">
                          #{healthData.length - index}
                        </span>
                        <div>
                          <p className="font-semibold text-white">Reading #{healthData.length - index}</p>
                          <p className="text-sm text-slate-400">{new Date(reading.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Vital Signs Summary */}
                    <div className="grid grid-cols-3 gap-4 text-center sm:text-right">
                      <div>
                        <p className="text-xs text-slate-400">Temperature</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{reading.temperature}°C</p>
                      </div>
                      {reading.bpm !== null && (
                        <div>
                          <p className="text-xs text-slate-400">Heart Rate</p>
                          <p className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">{reading.bpm}</p>
                        </div>
                      )}
                      {reading.spO2 !== null && (
                        <div>
                          <p className="text-xs text-slate-400">O2 Sat</p>
                          <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-500 bg-clip-text text-transparent">{reading.spO2}%</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="bg-gradient-to-r from-blue-900/20 to-slate-800/30 rounded-xl p-4 mt-4 border border-blue-800/30 hover:border-blue-700/50 transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <span className="text-xl animate-float">🤖</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">AI Analysis (Gemini)</p>
                        <p className="text-slate-300 leading-relaxed text-sm">{reading.aiResponse}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ESP32 Integration Info */}
        <div className="mt-8 bg-gradient-to-r from-blue-900/20 to-slate-800/20 border border-blue-800/50 rounded-2xl p-6 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-start gap-4">
            <span className="text-2xl animate-float">🔧</span>
            <div>
              <h3 className="font-bold text-white mb-2">ESP32 Setup Instructions</h3>
              <p className="text-sm text-slate-300 mb-3">
                To connect your ESP32 device and send vital signs data:
              </p>
              <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                <li>Configure your ESP32 to send POST requests to: <code className="bg-slate-800 px-2 py-1 rounded text-white font-mono text-xs border border-slate-700">/api/health/data</code></li>
                <li>Include temperature, humidity, BPM, and SpO2 in JSON format</li>
                <li>Use the session cookie for authentication</li>
                <li>Data will be processed by Gemini AI and displayed here with insights</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
