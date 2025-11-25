import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

type Props = {
  children?: React.ReactNode;
};

export const ProtectedRoute = ({ children }: Props) => {
  const token = useAuthStore((state) => state.accessToken);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
