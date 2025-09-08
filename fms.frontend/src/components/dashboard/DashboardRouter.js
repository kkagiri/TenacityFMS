import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import RealtimeDashboard from './RealtimeDashboard';
import WidgetTestPage from './WidgetTestPage';

/**
 * Dashboard Router with Widget Testing
 * Example integration showing how to add widget testing to your app
 */
const DashboardRouter = () => {
  return (
    <div className="dashboard-app">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">FMS Dashboard</Link>

          <div className="navbar-nav">
            <Link className="nav-link" to="/">Dashboard</Link>
            <Link className="nav-link" to="/widget-test">🧪 Widget Testing</Link>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<RealtimeDashboard />} />
        <Route path="/widget-test" element={<WidgetTestPage />} />
      </Routes>
    </div>
  );
};

export default DashboardRouter;
