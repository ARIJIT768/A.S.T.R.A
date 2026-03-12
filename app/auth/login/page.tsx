'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(formData.email, formData.password);
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs - Added pointer-events-none */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>

      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 backdrop-blur-sm border border-slate-700/50 animate-fade-in">
        <div className="mb-8 text-center">
          
          {/* --- UPDATED LOGO SECTION --- */}
          <div className="w-16 h-16 mx-auto mb-4 relative shadow-lg transform hover:scale-110 transition-transform duration-300 animate-float rounded-xl overflow-hidden bg-slate-800/50 flex items-center justify-center">
            <Image 
              src="/logo.jpeg" 
              alt="A.S.T.R.A Logo" 
              fill
              className="object-contain p-1"
              sizes="64px"
              priority
            />
          </div>
          {/* ---------------------------- */}

          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">A.S.T.R.A</h1>
          <p className="text-slate-400 mt-2 font-medium">Welcome back</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-sm animate-slide-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6 transform hover:scale-105 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p className="text-center text-slate-300 mt-6">
          Don't have an account?{' '}
          <a href="/auth/signup" className="text-green-400 font-semibold hover:underline transition-all duration-200">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
}