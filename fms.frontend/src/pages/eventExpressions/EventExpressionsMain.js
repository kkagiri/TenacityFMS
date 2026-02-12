/**
 * File: EventExpressionsMain.js
 * Purpose: Main routing component for the Event Expressions management module.
 *          Handles navigation between list, create, edit, and execution history views.
 * Dependencies: react-router-dom, EventExpressionList, EventExpressionForm, ExecutionHistory
 * Last Modified: 2026-02-06
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EventExpressionList from './components/EventExpressionList';
import EventExpressionForm from './components/EventExpressionForm';
import ExecutionHistory from './components/ExecutionHistory';

const EventExpressionsMain = () => {
    return (
        <div className="tw-h-full tw-flex tw-flex-col">
            <Routes>
                <Route index element={<EventExpressionList />} />
                <Route path="/create" element={<EventExpressionForm />} />
                <Route path="/:id/edit" element={<EventExpressionForm />} />
                <Route path="/:id/executions" element={<ExecutionHistory />} />
                <Route path="*" element={<Navigate to="/event-expressions" replace />} />
            </Routes>
        </div>
    );
};

export default EventExpressionsMain;
