import React from "react";
import "./Dashboard.scss"; // Import core dashboard styles
import RealtimeDashboard from "./RealtimeDashboard";

// Main Dashboard component that uses the real-time dashboard
// This component can be used to integrate with authentication context
export default function Dashboard() {
  return <RealtimeDashboard />;
}
