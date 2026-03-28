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
import withPermissionProtection from '../../utils/withPermissionProtection';
import EventExpressionsLayout from './layout/EventExpressionsLayout';
import { eventExpressionPermissions } from './utils/navigationHelper';

// Dashboard
import EventExpressionsDashboard from './dashboard/EventExpressionsDashboard';

// Expressions
import EventExpressionList from './components/EventExpressionList';
import EventExpressionForm from './components/EventExpressionForm';
import ExecutionHistory from './components/ExecutionHistory';
import EventTypesReference from './components/EventTypesReference';

// Active Events
import ActiveEventsList from './activeEvents/ActiveEventsList';

const ProtectedEventExpressionsDashboard = withPermissionProtection(
    EventExpressionsDashboard,
    eventExpressionPermissions.read
);

const ProtectedEventExpressionList = withPermissionProtection(
    EventExpressionList,
    eventExpressionPermissions.read
);

const ProtectedCreateEventExpressionForm = withPermissionProtection(
    EventExpressionForm,
    eventExpressionPermissions.create
);

const ProtectedEditEventExpressionForm = withPermissionProtection(
    EventExpressionForm,
    eventExpressionPermissions.edit
);

const ProtectedExecutionHistory = withPermissionProtection(
    ExecutionHistory,
    eventExpressionPermissions.read
);

const ProtectedEventTypesReference = withPermissionProtection(
    EventTypesReference,
    eventExpressionPermissions.read
);

const ProtectedActiveEventsList = withPermissionProtection(
    ActiveEventsList,
    eventExpressionPermissions.read
);

const EventExpressionsMain = () => {
    const location = useLocation();

    return (
        <EventExpressionsLayout currentPath={location.pathname}>
            <Routes>
                {/* Dashboard */}
                <Route index element={<ProtectedEventExpressionsDashboard />} />

                {/* Expression management */}
                <Route path="expressions" element={<ProtectedEventExpressionList />} />
                <Route path="create" element={<ProtectedCreateEventExpressionForm />} />
                <Route path=":id/edit" element={<ProtectedEditEventExpressionForm />} />
                <Route path=":id/executions" element={<ProtectedExecutionHistory />} />

                {/* Active events */}
                <Route path="active-events" element={<ProtectedActiveEventsList />} />

                {/* Reference */}
                <Route path="types" element={<ProtectedEventTypesReference />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/event-expressions" replace />} />
            </Routes>
        </EventExpressionsLayout>
    );
};

export default EventExpressionsMain;
