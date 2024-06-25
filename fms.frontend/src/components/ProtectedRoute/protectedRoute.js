import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext  } from '../../contexts/authContext';


const ProtectedRoute = ({ children, ...rest }) => {
  const { user } = useAuthContext ();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;};

export default ProtectedRoute;