import { useState, useEffect } from 'react';
import type { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

const ROLE_STORAGE_KEY = 'user-role';

export const useUserRole = () => {
  const auth = useAuth();

  // If user is authenticated, use their role from AuthContext
  const [role, setRole] = useState<UserRole>(() => {
    // First check if there's an authenticated user with a role
    if (auth.user?.role) {
      return auth.user.role as UserRole;
    }
    // Otherwise check localStorage
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    return (saved as UserRole) || 'student'; // По умолчанию - ученик
  });

  // Sync role with authenticated user
  useEffect(() => {
    if (auth.user?.role) {
      setRole(auth.user.role as UserRole);
    }
  }, [auth.user?.role]);

  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  }, [role]);

  const switchToTeacher = () => setRole('teacher');
  const switchToStudent = () => setRole('student');

  return {
    role,
    isTeacher: role === 'teacher',
    isStudent: role === 'student',
    switchToTeacher,
    switchToStudent,
    setRole,
  };
};
