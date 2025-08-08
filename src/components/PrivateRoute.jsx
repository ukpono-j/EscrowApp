import React from 'react';
import { Navigate } from 'react-router-dom';

// Protects routes requiring authentication by checking for access-token
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access-token');
  return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;