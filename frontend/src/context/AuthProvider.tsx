// frontend/src/context/AuthProvider.tsx
import React, { useEffect, useState } from 'react';
import { secureFetch } from '../utils/api'; // 👈 Import your credential-enabled fetch wrapper
import { AuthContext, type User } from './AuthContext'; // Import the context definition

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Session verification handshake on application mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await secureFetch('/api/protected-check');

        if (response.ok) {
          const data = await response.json();

          // Construct the user object from your backend response
          // Adjust this extraction based on your exact /api-docs configuration
          if (data.user) {
            setUser(data.user);
          } else if (data.userId) {
            setUser({ id: data.userId, name: '', email: '' });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Session verification handshake failed:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 2. Updated login handler (cookie is set implicitly by backend)
  const login = (newUser: User) => {
    setUser(newUser);
  };

  // 3. Updated logout handler (calls API to clear the secure cookie)
  const logout = async () => {
    try {
      await secureFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Failed to logout cleanly on backend:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
