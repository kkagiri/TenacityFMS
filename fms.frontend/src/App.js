import "devextreme/dist/css/dx.common.css";
import "./themes/generated/theme.base.css";
import "./themes/generated/dx.fluent.custom-scheme1.css";
import "./themes/generated/theme.additional.css";
import "./../assests/fontawesome/js/fontawesome";
import "./../assests/fontawesome/js/light";

import "./../assests/fontawesome/css/fontawesome.css";
import "./../assests/fontawesome/css/light.css";

import "ace-builds/css/ace.css";
import "ace-builds/css/theme/dreamweaver.css";
import "ace-builds/css/theme/ambiance.css";
//import './reportDesignerStyles.css';

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import StoreProvider from "./store";
import "./dx-styles.scss";
import LoadPanel from "devextreme-react/load-panel";
import { NavigationProvider } from "./contexts/navigation";
import { useScreenSizeClass } from "./utils/media-query";
import Content from "./Content";
import ProtectedRoute from "./components/ProtectedRoute/protectedRoute";
import UnauthenticatedContent from "./UnauthenticatedContent";
import { fetchNavigationItems } from "./redux/actions/navigationActions";
import SignalRService from "./signalR/SignalRService";
import { loadUser } from "./redux/actions/AuthActions";
import { initializeAxiosInstance } from "./api/axiosInstance"; // Import the initialization function
import ErrorBoundary from "./components/fuelingprocess/ErrorBoundary";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const [isApiInitialized, setIsApiInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initializeAxiosInstance(); // Initialize Axios instance
      setIsApiInitialized(true);
      SignalRService.startConnection();
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
