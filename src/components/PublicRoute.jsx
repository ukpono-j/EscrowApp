import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirects authenticated users to dashboard for public routes
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('access-token');
  return token ? <Navigate to="/dashboard" replace /> : children;
};

export default PublicRoute;