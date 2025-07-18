import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ element: Component, ...rest }) => {
  const token = localStorage.getItem("access-token"); // Changed from "auth-token" to "access-token"
  return token ? <Component {...rest} /> : <Navigate to="/login" />;
};

export default PrivateRoute;