import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const SystemProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user?.isSystemAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default SystemProtectedRoute;
