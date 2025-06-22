import React from "react";
import { Routes, Route } from "react-router-dom";
import NotificationDashboardPage from "./NotificationDashboardPage";

const NotificationRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<NotificationDashboardPage />} />
      {/* Add more notification-related routes here as needed */}
    </Routes>
  );
};

export default NotificationRoutes;