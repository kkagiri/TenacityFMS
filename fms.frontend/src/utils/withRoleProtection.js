import React from 'react';
import { Navigate ,useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const withRoleProtection = (Component, requiredRoles) => {
    return (props) => {
        const { user } = useSelector((state) => state.auth);
        const userRoles = user?.roles || [];
        const location = useLocation();

         // If the user is already on the unauthorized page, avoid redirection
    if (location.pathname === '/unauthorized') {
        return <Component {...props} />;
      }

        // Ensure requiredRoles is an array
        const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        // Ensure userRoles is an array before calling includes
        // Make role comparison case-insensitive
        const hasAccess = Array.isArray(userRoles) && rolesArray.some(role =>
            userRoles.some(userRole => userRole.toLowerCase() === role.toLowerCase())
        );

        if (!hasAccess) {
            return <Navigate to="/unauthorized" />;
        }

        return <Component {...props} />;
    };
};

export default withRoleProtection;
