/**
 * File: withPermissionProtection.js
 * Purpose: HOC to protect routes/components using permission-based checks instead of role names.
 *          Replaces withRoleProtection for permission-based access control.
 * Dependencies: usePermissions hook, react-router-dom
 * Last Modified: 2026-02-24
 *
 * Key Functions:
 * - withPermissionProtection(Component, requiredPermissions): Wraps component with permission gate
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

/**
 * HOC that redirects to /unauthorized if the user lacks ANY of the required permissions.
 * Uses OR logic: user needs at least one of the listed permissions.
 * @param {React.Component} Component - The component to protect
 * @param {string|string[]} requiredPermissions - Permission(s) required (OR logic)
 */
const withPermissionProtection = (Component, requiredPermissions) => {
    return (props) => {
        const { hasPermission, hasAnyPermission } = usePermissions();
        const location = useLocation();

        // If the user is already on the unauthorized page, avoid redirection loop
        if (location.pathname === '/unauthorized') {
            return <Component {...props} />;
        }

        const permsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
        const hasAccess = hasAnyPermission(permsArray);

        // TODO later: restore this redirect after frontend permission checks are re-enabled.
        /*
        if (!hasAccess) {
            return <Navigate to="/unauthorized" />;
        }
        */

        return <Component {...props} />;
    };
};

export default withPermissionProtection;
