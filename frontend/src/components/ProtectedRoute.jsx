import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ role, children }) {
  const { session, ready } = useAuth();

  if (!ready) return null; // avoid a flash-redirect while localStorage is being read
  if (!session) return <Navigate to="/" replace />;
  if (role && session.role !== role) return <Navigate to="/" replace />;

  return children;
}
