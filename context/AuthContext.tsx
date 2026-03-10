'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  deviceId?: string;
  createdAt: string;
}

export interface HealthData {
  id: string;
  temperature: number;
  humidity?: number | null;
  bpm?: number | null;
  spO2?: number | null;
  timestamp: string;
  aiResponse: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  healthData: HealthData[];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, age: number, gender: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => Promise<void>;
  addHealthData: (temperature: number, aiResponse: string) => Promise<void>;
  fetchHealthData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [healthData, setHealthData] = useState<HealthData[]>([]);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Fetch user profile from users table
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;

          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            deviceId: profile.device_id,
            createdAt: profile.created_at,
          });

          // Fetch health data
          const { data: healthRecords, error: healthError } = await supabase
            .from('health_data')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (!healthError && healthRecords) {
            setHealthData(
              healthRecords.map(record => ({
                id: record.id,
                temperature: record.temperature,
                humidity: record.humidity,
                bpm: record.bpm,
                spO2: record.spo2,
                timestamp: record.created_at,
                aiResponse: record.ai_response,
              }))
            );
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, age: number, gender: string) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error('User creation failed');

      // Create user profile via API (uses service role key to bypass RLS)
      const profileRes = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          email,
          name,
          age,
          gender: (gender as 'male' | 'female' | 'other') || 'other',
        }),
      });

      if (!profileRes.ok) {
        const error = await profileRes.json();
        throw new Error(error.error || 'Failed to create profile');
      }

      setUser({
        id: authData.user.id,
        email,
        name,
        age,
        gender: (gender as 'male' | 'female' | 'other') || 'other',
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error signing up:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        deviceId: profile.device_id,
        createdAt: profile.created_at,
      });

      // Fetch health data
      const { data: healthRecords, error: healthError } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false });

      if (!healthError && healthRecords) {
        setHealthData(
          healthRecords.map(record => ({
            id: record.id,
            temperature: record.temperature,
            humidity: record.humidity,
            bpm: record.bpm,
            spO2: record.spo2,
            timestamp: record.created_at,
            aiResponse: record.ai_response,
          }))
        );
      }
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }, []);

  const guestLogin = useCallback(async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

      if (authError || !authData.user) throw authError || new Error('Failed to create anonymous session');

      // Create guest user profile
      const guestName = `Guest_${Math.random().toString(36).substring(7)}`;
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: `${guestName}@guest.local`,
          name: guestName,
          age: 0,
          gender: 'other',
          is_guest: true,
          created_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      setUser({
        id: authData.user.id,
        email: `${guestName}@guest.local`,
        name: guestName,
        age: 0,
        gender: 'other',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging in as guest:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setHealthData([]);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }, []);

  const fetchHealthData = useCallback(async () => {
    try {
      if (!user) return;

      const { data: healthRecords, error } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHealthData(
        (healthRecords || []).map(record => ({
          id: record.id,
          temperature: record.temperature,
          humidity: record.humidity,
          bpm: record.bpm,
          spO2: record.spo2,
          timestamp: record.created_at,
          aiResponse: record.ai_response,
        }))
      );
    } catch (error) {
      console.error('Error fetching health data:', error);
      throw error;
    }
  }, [user]);

  const addHealthData = useCallback(async (temperature: number, aiResponse: string) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('health_data')
        .insert({
          user_id: user.id,
          temperature,
          ai_response: aiResponse,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      await fetchHealthData();
    } catch (error) {
      console.error('Error adding health data:', error);
      throw error;
    }
  }, [user, fetchHealthData]);

  return (
    <AuthContext.Provider value={{ user, isLoading, healthData, login, signup, guestLogin, logout, addHealthData, fetchHealthData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (undefined === context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
