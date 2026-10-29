'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentProfile } from '@/lib/types';
import { mockStudentProfile } from '@/lib/fixtures';

interface SessionContextType {
  phoneNumber: string;
  student: StudentProfile;
  setPhoneNumber: (phone: string) => void;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  resetToDemo: () => void;
}

const STORAGE_KEY_PHONE = 'pepea_session_phone';
const STORAGE_KEY_PROFILE = 'pepea_session_profile';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [phoneNumber, setPhone] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_PHONE) || mockStudentProfile.phoneNumber;
    }
    return mockStudentProfile.phoneNumber;
  });

  const [student, setStudent] = useState<StudentProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore corrupted JSON
        }
      }
    }
    return mockStudentProfile;
  });

  // Sync state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PHONE, phoneNumber);
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(student));
    }
  }, [student]);

  const setPhoneNumber = (phone: string) => {
    setPhone(phone);
    setStudent((prev) => ({ ...prev, phoneNumber: phone }));
  };

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setStudent((prev) => ({ ...prev, ...updates }));
  };

  const resetToDemo = () => {
    setPhone(mockStudentProfile.phoneNumber);
    setStudent(mockStudentProfile);
  };

  return (
    <SessionContext.Provider
      value={{
        phoneNumber,
        student,
        setPhoneNumber,
        updateProfile,
        resetToDemo,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useStudentSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useStudentSession must be used within a SessionProvider');
  }
  return context;
}

