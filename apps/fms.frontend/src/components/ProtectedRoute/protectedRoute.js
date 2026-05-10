import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext  } from '../../contexts/authContext';
import { buildLoginRedirectUrl } from '../../utils/authRedirect';


const ProtectedRoute = ({ children, ...rest }) => {
  const { user } = useAuthContext ();
  const location = useLocation();

  if (!user) {
    const returnUrl = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={buildLoginRedirectUrl(returnUrl)} replace />;
  }

  return children;};

export default ProtectedRoute;