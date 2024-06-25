import React from 'react';
import { Navigate ,useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const withRoleProtection = (Component, requiredRoles) => {
    return (props) => {
        const { user } = useSelector((state) => state.auth);
        const userRoles = user ? user.roles : [];
        const location = useLocation();

         // If the user is already on the unauthorized page, avoid redirection
    if (location.pathname === '/unauthorized') {
        return <Component {...props} />;
      }

        const hasAccess = requiredRoles.some(role => userRoles.includes(role));

        if (!hasAccess) {
            return <Navigate to="/unauthorized" />;
        }

        return <Component {...props} />;
    };
};

export default withRoleProtection;
