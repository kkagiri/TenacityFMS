import React from 'react';
import { useLocation } from 'react-router-dom';
import NotificationLayout from './layout/NotificationLayout';
import Dashboard from './dashboard/Dashboard';
import PolicyManagement from './policies/PolicyManagement';
import PolicyCreate from './policies/PolicyCreate';
import PolicyEdit from './policies/PolicyEdit';
import EmailConfiguration from './configuration/EmailConfiguration';
import TemplateManagement from './configuration/TemplateManagement';
import RecipientManagement from './recipients/RecipientManagement';
import NotificationHistory from './history/NotificationHistory';
import TestingPanel from './testing/TestingPanel';

const NotificationSystem = () => {
  const location = useLocation();

  // Extract the sub-route from the current path
  // If we're at /notifications, show dashboard
  // If we're at /notifications/policies, show policies, etc.
  const getSubRoute = () => {
    const path = location.pathname;
    const basePath = '/notifications';

    if (path === basePath || path === basePath + '/') {
      return 'dashboard';
    }

    // Extract sub-route (everything after /notifications/)
    const subPath = path.replace(basePath + '/', '').split('/')[0];
    return subPath || 'dashboard';
  };

  const subRoute = getSubRoute();

  const renderContent = () => {
    switch (subRoute) {
      case 'dashboard':
        return <Dashboard />;
      case 'policies':
        if (location.pathname.includes('/create')) {
          return <PolicyCreate />;
        } else if (location.pathname.includes('/edit')) {
          return <PolicyEdit />;
        }
        return <PolicyManagement />;
      case 'configuration':
        if (location.pathname.includes('/email')) {
          return <EmailConfiguration />;
        } else if (location.pathname.includes('/templates')) {
          return <TemplateManagement />;
        }
        return <EmailConfiguration />; // Default to email config
      case 'recipients':
        return <RecipientManagement />;
      case 'history':
        return <NotificationHistory />;
      case 'testing':
        return <TestingPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <NotificationLayout currentPath={location.pathname}>
      {renderContent()}
    </NotificationLayout>
  );
};

export default NotificationSystem;
