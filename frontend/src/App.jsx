import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import CentralDashboard from "./pages/CentralDashboard";
import BranchDashboard from "./pages/BranchDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/central"
        element={
          <ProtectedRoute role="CENTRAL">
            <CentralDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/branch"
        element={
          <ProtectedRoute role="BRANCH">
            <BranchDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
