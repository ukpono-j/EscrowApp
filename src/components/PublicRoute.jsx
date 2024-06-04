// src/components/PublicRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ element: Component, ...rest }) => {
  const token = localStorage.getItem("auth-token");
  return token ? <Navigate to="/dashboard" /> : <Component {...rest} />;
};

export default PublicRoute;
