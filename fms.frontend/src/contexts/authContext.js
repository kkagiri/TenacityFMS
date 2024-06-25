import react , { useState, useEffect, createContext, useContext, useCallback } from 'react';
import  {useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signIn as signInAction, loadUser as loadUserAction, logout as logoutAction } from './../actions/AuthActions';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);



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
    navigate('/login');
  };
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);