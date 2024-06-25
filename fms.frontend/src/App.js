import 'devextreme/dist/css/dx.common.css';
import './themes/generated/theme.base.css';
import './themes/generated/dx.fluent.custom-scheme1.css';
import './themes/generated/theme.additional.css';



import React , { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import StoreProvider from './store';
import './dx-styles.scss';
import LoadPanel from 'devextreme-react/load-panel';
import { NavigationProvider } from './contexts/navigation';
import { useScreenSizeClass } from './utils/media-query';
import Content from './Content';
import ProtectedRoute from './components/ProtectedRoute/protectedRoute';
import UnauthenticatedContent from './UnauthenticatedContent';
import  {loadUser}  from './actions/AuthActions'

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);
  if (loading) {
    return <LoadPanel visible={true} />;
  }

  return isAuthenticated ? <Content /> : <UnauthenticatedContent />;

}
export default function Root() {
  const screenSizeClass = useScreenSizeClass();

  return (
        <NavigationProvider>
          <div className={`app ${screenSizeClass}`}>
            <App />
          </div>
        </NavigationProvider>
  );
}
