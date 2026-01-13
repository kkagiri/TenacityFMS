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
import UserPreferences from './preferences/UserPreferences';
import NotificationHistory from './history/NotificationHistory';
import TestingPanel from './testing/TestingPanel';
import NotificationCategoriesTab from '../admin/notification-settings/NotificationCategoriesTab';
import { NOTIFICATION_BASE_PATH } from './utils/navigationHelper';

const NotificationSystem = () => {
  const location = useLocation();

  // Extract the sub-route from the current path
  // Base path is /admin/notification
  const getSubRoute = () => {
    const path = location.pathname;

    if (path === NOTIFICATION_BASE_PATH || path === NOTIFICATION_BASE_PATH + '/') {
      return 'dashboard';
    }

    // Extract sub-route (everything after /admin/notification/)
    const subPath = path.replace(NOTIFICATION_BASE_PATH + '/', '').split('/')[0];
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
      case 'categories':
        return <NotificationCategoriesTab />;
      case 'configuration':
        if (location.pathname.includes('/email')) {
          return <EmailConfiguration />;
        } else if (location.pathname.includes('/templates')) {
          return <TemplateManagement />;
        }
        return <EmailConfiguration />; // Default to email config
      case 'recipients':
        return <RecipientManagement />;
      case 'preferences':
        return <UserPreferences />;
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
