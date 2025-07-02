// Navigation helper for task management system routes

export const getTaskManagementRoute = (subPath = '') => {
  const basePath = '/task-management';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

export const taskManagementRoutes = {
  dashboard: '/task-management',
  myTasks: '/task-management/my-tasks',
  allTasks: '/task-management/all-tasks',
  create: '/task-management/create',
  edit: (id) => `/task-management/edit/${id}`,
  details: (id) => `/task-management/details/${id}`,
  taskTypes: '/task-management/task-types',
  templates: '/task-management/templates'
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/task-management') {
    return currentPath === '/task-management' || currentPath === '/task-management/';
  }
  return currentPath.startsWith(targetPath);
};

// Helper to get view name from path
export const getViewFromPath = (path) => {
  if (!path || path === '/task-management' || path === '/task-management/') {
    return 'dashboard';
  }

  const segments = path.split('/');
  const lastSegment = segments[segments.length - 1];

  switch (lastSegment) {
    case 'my-tasks':
      return 'my-tasks';
    case 'all-tasks':
      return 'all-tasks';
    case 'create':
      return 'create';
    case 'task-types':
      return 'task-types';
    case 'templates':
      return 'templates';
    default:
      if (segments.includes('edit')) {
        return 'edit';
      }
      if (segments.includes('details')) {
        return 'details';
      }
      return 'dashboard';
  }
};

// Helper to build navigation breadcrumbs
export const getTaskBreadcrumbs = (currentPath, taskTitle = null) => {
  const breadcrumbs = [
    { text: 'Task Management', path: taskManagementRoutes.dashboard }
  ];

  if (currentPath.includes('/my-tasks')) {
    breadcrumbs.push({ text: 'My Tasks', path: taskManagementRoutes.myTasks });
  } else if (currentPath.includes('/all-tasks')) {
    breadcrumbs.push({ text: 'All Tasks', path: taskManagementRoutes.allTasks });
  } else if (currentPath.includes('/create')) {
    breadcrumbs.push({ text: 'Create Task', path: taskManagementRoutes.create });
  } else if (currentPath.includes('/edit')) {
    breadcrumbs.push({ text: 'All Tasks', path: taskManagementRoutes.allTasks });
    breadcrumbs.push({ text: `Edit: ${taskTitle || 'Task'}`, path: currentPath });
  } else if (currentPath.includes('/details')) {
    breadcrumbs.push({ text: 'All Tasks', path: taskManagementRoutes.allTasks });
    breadcrumbs.push({ text: `Details: ${taskTitle || 'Task'}`, path: currentPath });
  } else if (currentPath.includes('/task-types')) {
    breadcrumbs.push({ text: 'Task Types', path: taskManagementRoutes.taskTypes });
  } else if (currentPath.includes('/templates')) {
    breadcrumbs.push({ text: 'Templates', path: taskManagementRoutes.templates });
  }

  return breadcrumbs;
};

// Helper to get navigation state for current view
export const getNavigationState = (currentPath) => {
  const view = getViewFromPath(currentPath);
  return {
    currentView: view,
    isMainView: ['dashboard', 'my-tasks', 'all-tasks'].includes(view),
    isEditView: view === 'edit',
    isDetailsView: view === 'details',
    isCreateView: view === 'create',
    isConfigView: ['task-types', 'templates'].includes(view)
  };
};
