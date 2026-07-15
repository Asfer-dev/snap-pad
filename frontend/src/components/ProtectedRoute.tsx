// frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50">
        <span className="text-sm text-neutral-400 font-medium animate-pulse">
          Verifying secure session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while saving the attempted path in browser state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
