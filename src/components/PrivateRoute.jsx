import React from 'react';
import { Navigate } from 'react-router-dom';

// Protects routes requiring authentication by checking for access-token
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access-token');
   const role =  sessionStorage.getItem("user_role");

   if(token && !role){
    return <Navigate to="/onbroading" replace />;

   }


  return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;