/**
 * File: EventExpressionsMain.js
 * Purpose: Main routing component for the Event Expressions module.
 *          Wraps all sub-routes in EventExpressionsLayout (sidebar + header).
 *          Pattern mirrors VehicleMain.js.
 * Dependencies: react-router-dom, EventExpressionsLayout, all sub-page components
 * Last Modified: 2026-02-18
 *
 * Routes:
 * - /                     → Dashboard
 * - /expressions          → Expression list grid
 * - /active-events        → Active events list
 * - /create               → Create new expression
 * - /:id/edit             → Edit expression
 * - /:id/executions       → Execution history
 * - /types                → Event types reference
 */

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import EventExpressionsLayout from './layout/EventExpressionsLayout';

// Dashboard
import EventExpressionsDashboard from './dashboard/EventExpressionsDashboard';

// Expressions
import EventExpressionList from './components/EventExpressionList';
import EventExpressionForm from './components/EventExpressionForm';
import ExecutionHistory from './components/ExecutionHistory';
import EventTypesReference from './components/EventTypesReference';

// Active Events
import ActiveEventsList from './activeEvents/ActiveEventsList';

const EventExpressionsMain = () => {
    const location = useLocation();

    return (
        <EventExpressionsLayout currentPath={location.pathname}>
            <Routes>
                {/* Dashboard */}
                <Route index element={<EventExpressionsDashboard />} />

                {/* Expression management */}
                <Route path="expressions" element={<EventExpressionList />} />
                <Route path="create" element={<EventExpressionForm />} />
                <Route path=":id/edit" element={<EventExpressionForm />} />
                <Route path=":id/executions" element={<ExecutionHistory />} />

                {/* Active events */}
                <Route path="active-events" element={<ActiveEventsList />} />

                {/* Reference */}
                <Route path="types" element={<EventTypesReference />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/event-expressions" replace />} />
            </Routes>
        </EventExpressionsLayout>
    );
};

export default EventExpressionsMain;
