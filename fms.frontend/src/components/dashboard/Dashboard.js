import React from "react";
import RoleBasedDashboard from "./RoleBasedDashboard";

// Main Dashboard component that uses the role-based dashboard
// This component can be used to integrate with authentication context
export default function Dashboard() {
  return <RoleBasedDashboard />;
}
