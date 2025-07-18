import React from "react";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ element: Component, ...rest }) => {
  const token = localStorage.getItem("access-token"); // Changed from "auth-token" to "access-token"
  return token ? <Navigate to="/dashboard" /> : <Component {...rest} />;
};

export default PublicRoute;