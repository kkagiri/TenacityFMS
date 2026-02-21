/**
 * File: navigationHelper.js
 * Purpose: Route definitions and sidebar navigation groups for the Event Expressions module.
 *          Mirrors the vehicle module's navigationHelper pattern.
 * Dependencies: None
 * Last Modified: 2026-02-18
 *
 * Key Exports:
 * - eventRoutes: all route path constants
 * - navigationGroups: sidebar nav items grouped by domain
 * - isActiveRoute(): highlight helper
 */

export const eventRoutes = {
    dashboard: '/event-expressions',
    expressions: '/event-expressions/expressions',
    activeEvents: '/event-expressions/active-events',
    create: '/event-expressions/create',
    types: '/event-expressions/types',
};

export const getEventRoute = (subPath = '') => {
    const basePath = '/event-expressions';
    if (!subPath) return basePath;
    return `${basePath}/${subPath}`;
};

/** Build route to expression edit page */
export const getExpressionEditRoute = (id) => `/event-expressions/${id}/edit`;

/** Build route to expression execution history */
export const getExecutionHistoryRoute = (id) => `/event-expressions/${id}/executions`;

/** Check if current path matches a route (used for sidebar active state) */
export const isActiveRoute = (currentPath, targetPath) => {
    if (targetPath === '/event-expressions') {
        return currentPath === '/event-expressions' || currentPath === '/event-expressions/';
    }
    return currentPath.startsWith(targetPath);
};

/** Sidebar navigation groups */
export const navigationGroups = {
    main: [
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: 'fa-light fa-chart-mixed',
            path: eventRoutes.dashboard,
            badge: null,
        },
        {
            id: 'expressions',
            title: 'Expressions',
            icon: 'fa-light fa-waveform-lines',
            path: eventRoutes.expressions,
            badge: null,
            description: 'Manage event expression rules',
        },
        {
            id: 'active-events',
            title: 'Active Events',
            icon: 'fa-light fa-bell-exclamation',
            path: eventRoutes.activeEvents,
            badge: 'Live',
            description: 'View and manage live event alerts',
        },
    ],
    operations: [
        {
            id: 'create',
            title: 'Create Expression',
            icon: 'fa-light fa-plus-circle',
            path: eventRoutes.create,
        },
        {
            id: 'types',
            title: 'Event Types',
            icon: 'fa-light fa-layer-group',
            path: eventRoutes.types,
            description: 'Browse available event types & conditions',
        },
    ],
};
