//Cursor - Create Task Management main page
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import TaskManagementLayout from './layout/TaskManagementLayout';
import MyTasksList from './components/MyTasksList';
import AllTasksGrid from './components/AllTasksGrid';
import TaskCreationForm from './components/TaskCreationForm';
import TaskSummaryDashboard from './components/TaskSummaryDashboard';
import TaskAnalytics from './components/TaskAnalytics';
import SampleDataDemo from './components/SampleDataDemo';
import TaskTypesPage from './components/TaskTypesPage';
import TaskTemplatesPage from './components/TaskTemplatesPage';
import TaskService from '../../services/taskService';
import { getTaskManagementRoute } from './utils/navigationHelper';
import './TaskManagement.scss';

const TaskManagement = () => {
  const [currentView, setCurrentView] = useState('my-tasks');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const user = useSelector(state => state.auth.user);

  const isAdmin = user?.role === 'Admin';
  const isSupervisor = user?.role === 'Supervisor' || isAdmin;

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const handleTaskCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTaskUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'my-tasks':
        return (
          <MyTasksList
            key={`my-tasks-${refreshTrigger}`}
            onNavigate={handleNavigation}
          />
        );
      case 'all-tasks':
        return isSupervisor ? (
          <AllTasksGrid
            key={`all-tasks-${refreshTrigger}`}
            onNavigate={handleNavigation}
            onTaskUpdated={handleTaskUpdated}
          />
        ) : (
          <MyTasksList
            key={`my-tasks-${refreshTrigger}`}
            onNavigate={handleNavigation}
          />
        );
      case 'dashboard':
        return (
          <TaskSummaryDashboard
            key={`dashboard-${refreshTrigger}`}
            onNavigate={handleNavigation}
          />
        );
      case 'analytics':
        return (
          <TaskAnalytics
            key={`analytics-${refreshTrigger}`}
            onNavigate={handleNavigation}
          />
        );
      case 'sample-demo':
        return (
          <SampleDataDemo
            key={`sample-demo-${refreshTrigger}`}
            onNavigate={handleNavigation}
            onDataChanged={handleTaskUpdated}
          />
        );
      case 'task-types':
        return (
          <TaskTypesPage
            key={`task-types-${refreshTrigger}`}
            onNavigate={handleNavigation}
          />
        );
      case 'templates':
        return (
          <TaskTemplatesPage
            key={`templates-${refreshTrigger}`}
            onNavigate={handleNavigation}
          />
        );
      case 'create':
        // In demo mode, allow all users to create tasks for testing purposes
        // In production, only supervisors and admins can create tasks
        const canCreateTask = isSupervisor || TaskService.isDemoMode();

        return canCreateTask ? (
          <TaskCreationForm
            onTaskCreated={handleTaskCreated}
            onNavigate={handleNavigation}
          />
        ) : (
          <div className="tw-p-6 tw-bg-white tw-rounded-lg tw-shadow">
            <div className="tw-text-center tw-py-8">
              <i className="fa-light fa-lock tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-2">
                Access Restricted
              </h3>
              <p className="tw-text-gray-600 tw-mb-4">
                Only supervisors and administrators can create tasks.
              </p>
              <p className="tw-text-sm tw-text-blue-600">
                Enable Demo Mode to test task creation functionality.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <MyTasksList
            key={`my-tasks-${refreshTrigger}`}
            onNavigate={handleNavigation}
          />
        );
    }
  };

  return (
    <TaskManagementLayout
      currentPath={getTaskManagementRoute(currentView)}
      onNavigate={handleNavigation}
    >
      {renderCurrentView()}
    </TaskManagementLayout>
  );
};

export default TaskManagement;