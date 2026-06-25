import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginStudent: (login: string, password: string) => Promise<User>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("authUser") : null;

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Basic validation: check if user object has required fields
        // Note: email is optional for students
        if (parsedUser.id && parsedUser.role) {
          setToken(storedToken);
          setUser(parsedUser);
        } else {
          // Invalid user object, clear storage
          typeof window !== "undefined" && localStorage.removeItem('authToken');
          typeof window !== "undefined" && localStorage.removeItem('authUser');
        }
      } catch (error) {
        // Error parsing user, clear storage
        typeof window !== "undefined" && localStorage.removeItem('authToken');
        typeof window !== "undefined" && localStorage.removeItem('authUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch('/kids-api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Login failed');
    }

    const { token: newToken, user: newUser } = data.data;
    setToken(newToken);
    setUser(newUser);
    typeof window !== "undefined" && localStorage.setItem('authToken', newToken);
    typeof window !== "undefined" && localStorage.setItem('authUser', JSON.stringify(newUser));
    return newUser;
  };

  const loginStudent = async (login: string, password: string): Promise<User> => {
    const response = await fetch('/kids-api/auth/student-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ login, password }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Login failed');
    }

    const { token: newToken, user: newUser } = data.data;
    setToken(newToken);
    setUser(newUser);
    typeof window !== "undefined" && localStorage.setItem('authToken', newToken);
    typeof window !== "undefined" && localStorage.setItem('authUser', JSON.stringify(newUser));
    return newUser;
  };

  const register = async (email: string, password: string, displayName: string) => {
    const response = await fetch('/kids-api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, displayName }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Registration failed');
    }

    const { token: newToken, user: newUser } = data.data;
    setToken(newToken);
    setUser(newUser);
    typeof window !== "undefined" && localStorage.setItem('authToken', newToken);
    typeof window !== "undefined" && localStorage.setItem('authUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    typeof window !== "undefined" && localStorage.removeItem('authToken');
    typeof window !== "undefined" && localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginStudent, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
