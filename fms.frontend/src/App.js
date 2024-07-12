import 'devextreme/dist/css/dx.common.css';
import './themes/generated/theme.base.css';
import './themes/generated/dx.fluent.custom-scheme1.css';
import './themes/generated/theme.additional.css';



import React , { useEffect,useState } from 'react';
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
import { initializeAxiosInstance } from './api/axiosInstance'; // Import the initialization function

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const [isApiInitialized, setIsApiInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initializeAxiosInstance(); // Initialize Axios instance
      setIsApiInitialized(true);
      console.log('API initialized and Axios instance ready');
      dispatch(loadUser());
    };
    initialize();
  }, [dispatch]);

  if (loading || !isApiInitialized) {
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
