import react , { useState, useEffect, createContext, useContext, useCallback } from 'react';
import  {useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signIn as signInAction, loadUser as loadUserAction, logout as logoutAction } from './../redux/actions/AuthActions';
import { buildLoginRedirectUrl, getCurrentRelativeUrl } from '../utils/authRedirect';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);

  // 3-Audience Architecture — surface tenant context derived from JWT.
  // App.js routing branches on viewMode; FMS.Admin gating uses isPlatformOperator.
  const tenantKind = useSelector(state => state.tenantContext?.tenantKind ?? 'client');
  const isPlatformOperator = useSelector(state => state.tenantContext?.isPlatformOperator ?? false);
  const tenantId = useSelector(state => state.tenantContext?.tenantId ?? null);
  const parentTenantId = useSelector(state => state.tenantContext?.parentTenantId ?? null);

  // ViewMode is what fms.frontend uses to choose the route tree:
  //   - 'client'   → full operations (default for legacy tokens too)
  //   - 'customer' → restricted view (My Vehicles / Transactions / Reports / Users)
  // System-tenant operators are redirected to FMS.Admin elsewhere; we still
  // give them 'client' here so they don't see a broken Customer view if they
  // accidentally land on this app.
  const viewMode = tenantKind === 'customer' ? 'customer' : 'client';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(loadUserAction());
    } else {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  const signIn = async (username, password) => {
    const result = await dispatch(signInAction(username, password));
    if (result.isOk) {
      navigate('/home');
    }
    return result;
  };

  const signOut = () => {
    localStorage.removeItem('token');
    dispatch(logoutAction());
    navigate(buildLoginRedirectUrl(getCurrentRelativeUrl()), { replace: true });
  };
  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      // 3-Audience tenant context
      viewMode,
      tenantKind,
      tenantId,
      parentTenantId,
      isPlatformOperator,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
