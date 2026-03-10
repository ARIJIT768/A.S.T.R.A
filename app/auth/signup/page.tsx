'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Signup() {
  const router = useRouter();
  const { signup } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.age) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await signup(formData.email, formData.password, formData.name, parseInt(formData.age), formData.gender);
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs - Added pointer-events-none to prevent blocking clicks */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>

      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 backdrop-blur-sm border border-slate-700/50 animate-fade-in max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-110 transition-transform duration-300 animate-float">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">MediCare</h1>
          <p className="text-slate-400 mt-2 font-medium">Create your health account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-sm animate-slide-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 h-12 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 h-12 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
              placeholder="you@example.com"
            />
          </div>

          {/* Corrected 2-column grid layout for Age and Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 h-12 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
                placeholder="25"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="relative z-50 w-full px-4 h-12 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-slate-700 text-white cursor-pointer"
              >
                <option value="" disabled className="bg-slate-700 text-slate-400">Select Gender</option>
                <option value="male" className="bg-slate-700 text-white">Male</option>
                <option value="female" className="bg-slate-700 text-white">Female</option>
                <option value="other" className="bg-slate-700 text-white">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 h-12 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 h-12 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white h-12 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6 transform hover:scale-105 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-slate-300 mt-4">
          Already have an account?{' '}
          <a href="/auth/login" className="text-green-400 font-semibold hover:underline transition-all duration-200">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}