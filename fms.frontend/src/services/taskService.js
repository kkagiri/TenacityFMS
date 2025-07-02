//Cursor - Create Task Management index
//Cursor - Create Task Service
import axiosInstance from '../api/axiosInstance';
import SampleDataService from './sampleDataService';

export class TaskService {
  // Check if we're in demo mode (you can control this via localStorage or environment)
  static isDemoMode() {
    return localStorage.getItem('taskManagementDemoMode') === 'true' ||
           window.location.search.includes('demo=true') ||
           process.env.REACT_APP_TASK_DEMO_MODE === 'true' ||
           true; // Enable demo mode by default for testing
  }

  static async getTasks(filter = {}) {
    // Use sample data service in demo mode
    if (this.isDemoMode()) {
      return SampleDataService.getTasksPaginated(filter);
    }

    try {
      const params = new URLSearchParams();

      if (filter.types?.length) params.append('types', filter.types.join(','));
      if (filter.priorities?.length) params.append('priorities', filter.priorities.join(','));
      if (filter.status?.length) params.append('status', filter.status.join(','));
      if (filter.assignedTo) params.append('assignedTo', filter.assignedTo);
      if (filter.siteIds?.length) params.append('siteIds', filter.siteIds.join(','));
      if (filter.tankIds?.length) params.append('tankIds', filter.tankIds.join(','));
      if (filter.startDate) params.append('startDate', filter.startDate.toISOString());
      if (filter.endDate) params.append('endDate', filter.endDate.toISOString());
      if (filter.overdueOnly) params.append('overdueOnly', filter.overdueOnly);
      if (filter.sourceType) params.append('sourceType', filter.sourceType);
      if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
      if (filter.page) params.append('page', filter.page);
      if (filter.pageSize) params.append('pageSize', filter.pageSize);
      if (filter.sortBy) params.append('sortBy', filter.sortBy);
      if (filter.sortDirection) params.append('sortDirection', filter.sortDirection);

      const response = await axiosInstance.get(`/api/task?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }

  static async getTaskById(id) {
    // Use sample data service in demo mode
    if (this.isDemoMode()) {
      const tasks = await SampleDataService.getTasks();
      const task = tasks.data.find(t => t.id === id);
      if (task) {
        return { data: task, success: true };
      } else {
        throw new Error('Task not found');
      }
    }

    try {
      const response = await axiosInstance.get(`/api/task/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch task');
    }
  }

  static async createTask(taskData) {
    // Use sample data service in demo mode
    if (this.isDemoMode()) {
      return SampleDataService.createTask(taskData);
    }

    try {
      const response = await axiosInstance.post('/api/task', taskData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create task');
    }
  }

  static async updateTask(id, taskData) {
    // Use sample data service in demo mode
    if (this.isDemoMode()) {
      const tasks = await SampleDataService.getTasks();
      const taskIndex = tasks.data.findIndex(t => t.id === id);
      if (taskIndex !== -1) {
        tasks.data[taskIndex] = { ...tasks.data[taskIndex], ...taskData };
        return { data: tasks.data[taskIndex], success: true };
      } else {
        throw new Error('Task not found');
      }
    }

    try {
      const response = await axiosInstance.put(`/api/task/${id}`, taskData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update task');
    }
  }

  static async deleteTask(id) {
    // Use sample data service in demo mode
    if (this.isDemoMode()) {
      return SampleDataService.deleteTask(id);
    }

    try {
      const response = await axiosInstance.delete(`/api/task/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete task');
    }
  }

  static async assignTask(id, assignmentData) {
    // Use sample data service in demo mode
    if (this.isDemoMode()) {
      return SampleDataService.assignTask(id, assignmentData);
    }

    try {
      const response = await axiosInstance.post(`/api/task/${id}/assign`, assignmentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to assign task');
    }
  }

  static async completeTask(id, completionData) {
    // Use sample data service in demo mode
    if (this.isDemoMode()) {
      return SampleDataService.completeTask(id, completionData);
    }

    try {
      const response = await axiosInstance.post(`/api/task/${id}/complete`, completionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to complete task');
    }
  }

  static async getMyTasks(includeCompleted = false) {
    // Use sample data service in demo mode
    if (this.isDemoMode()) {
      const tasks = await SampleDataService.getTasks();
      const userTasks = tasks.data.filter(task => {
        const user = localStorage.getItem('currentUser') || 'demo@example.com';
        const isMyTask = task.assignedTo === user;
        return includeCompleted ? isMyTask : isMyTask && task.status !== 'Completed';
      });
      return { data: userTasks, success: true };
    }

    try {
      const response = await axiosInstance.get(`/api/task/my-tasks?includeCompleted=${includeCompleted}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch my tasks');
    }
  }

  static async getTaskSummary(siteId = null, startDate = null, endDate = null) {
    // Use sample data service in demo mode
    if (this.isDemoMode()) {
      return { data: SampleDataService.getTaskAnalytics(), success: true };
    }

    try {
      const params = new URLSearchParams();
      if (siteId) params.append('siteId', siteId);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await axiosInstance.get(`/api/task/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch task summary');
    }
  }

  static async getOverdueTasks(siteId = null, assignedTo = null) {
    // Use sample data service in demo mode
    if (this.isDemoMode()) {
      const tasks = await SampleDataService.getTasks();
      const overdueTasks = tasks.data.filter(task => {
        const isOverdue = task.status === 'Overdue' || (task.dueDate < new Date() && task.status !== 'Completed');
        let matches = isOverdue;
        if (siteId) matches = matches && task.siteId === siteId;
        if (assignedTo) matches = matches && task.assignedTo === assignedTo;
        return matches;
      });
      return { data: overdueTasks, success: true };
    }

    try {
      const params = new URLSearchParams();
      if (siteId) params.append('siteId', siteId);
      if (assignedTo) params.append('assignedTo', assignedTo);

      const response = await axiosInstance.get(`/api/task/overdue?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch overdue tasks');
    }
  }

  // Task Generation Methods
  static async convertIssueToTask(issueId) {
    try {
      const response = await axiosInstance.post(`/api/task/convert-issue/${issueId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to convert issue to task');
    }
  }

  static async autoGenerateFromDiscrepancies() {
    try {
      const response = await axiosInstance.post('/api/task/auto-generate-from-discrepancies');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to auto-generate tasks from discrepancies');
    }
  }

  // Utility Methods
  static getTaskTypeOptions() {
    return [
      { value: 'Manual', text: 'Manual' },
      { value: 'Maintenance', text: 'Maintenance' },
      { value: 'Discrepancy', text: 'Discrepancy' },
      { value: 'Stock', text: 'Stock' },
      { value: 'Inspection', text: 'Inspection' },
      { value: 'Calibration', text: 'Calibration' },
      { value: 'TransactionCorrection', text: 'Transaction Correction' }
    ];
  }

  static getTaskPriorityOptions() {
    return [
      { value: 'Low', text: 'Low' },
      { value: 'Medium', text: 'Medium' },
      { value: 'High', text: 'High' },
      { value: 'Critical', text: 'Critical' }
    ];
  }

  static getTaskStatusOptions() {
    return [
      { value: 'Pending', text: 'Pending' },
      { value: 'InProgress', text: 'In Progress' },
      { value: 'Completed', text: 'Completed' },
      { value: 'Cancelled', text: 'Cancelled' },
      { value: 'Overdue', text: 'Overdue' },
      { value: 'NeedsApproval', text: 'Needs Approval' }
    ];
  }

  static getPriorityColor(priority) {
    switch (priority?.toLowerCase()) {
      case 'critical': return { bg: 'tw-bg-red-100', text: 'tw-text-red-800', border: 'tw-border-red-200' };
      case 'high': return { bg: 'tw-bg-orange-100', text: 'tw-text-orange-800', border: 'tw-border-orange-200' };
      case 'medium': return { bg: 'tw-bg-yellow-100', text: 'tw-text-yellow-800', border: 'tw-border-yellow-200' };
      case 'low': return { bg: 'tw-bg-green-100', text: 'tw-text-green-800', border: 'tw-border-green-200' };
      default: return { bg: 'tw-bg-gray-100', text: 'tw-text-gray-800', border: 'tw-border-gray-200' };
    }
  }

  static getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'completed': return { bg: 'tw-bg-green-100', text: 'tw-text-green-800', border: 'tw-border-green-200' };
      case 'in progress': return { bg: 'tw-bg-blue-100', text: 'tw-text-blue-800', border: 'tw-border-blue-200' };
      case 'pending': return { bg: 'tw-bg-gray-100', text: 'tw-text-gray-800', border: 'tw-border-gray-200' };
      case 'overdue': return { bg: 'tw-bg-red-100', text: 'tw-text-red-800', border: 'tw-border-red-200' };
      case 'cancelled': return { bg: 'tw-bg-gray-100', text: 'tw-text-gray-600', border: 'tw-border-gray-200' };
      case 'needs approval': return { bg: 'tw-bg-purple-100', text: 'tw-text-purple-800', border: 'tw-border-purple-200' };
      default: return { bg: 'tw-bg-gray-100', text: 'tw-text-gray-800', border: 'tw-border-gray-200' };
    }
  }

  static async updateTaskStatus(taskId, status, notes = '') {
    // Use sample data service in demo mode
    if (this.isDemoMode()) {
      return this.updateTask(taskId, { status, notes });
    }

    try {
      const response = await axiosInstance.put(`/api/task/${taskId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update task status');
    }
  }

  static isTaskOverdue(task) {
    if (!task.dueDate || task.status === 'Completed' || task.status === 'Cancelled') {
      return false;
    }
    return new Date(task.dueDate) < new Date();
  }

  static getTaskUrgencyLevel(task) {
    const isOverdue = this.isTaskOverdue(task);
    const isCritical = task.priority === 'Critical';
    const isHighPriority = task.priority === 'High';

    if (isOverdue && isCritical) return 'critical-overdue';
    if (isOverdue) return 'overdue';
    if (isCritical) return 'critical';
    if (isHighPriority) return 'high';
    return 'normal';
  }

  // Demo mode utilities
  static enableDemoMode() {
    localStorage.setItem('taskManagementDemoMode', 'true');
    console.log('🎭 Task Management Demo Mode ENABLED');
  }

  static disableDemoMode() {
    localStorage.setItem('taskManagementDemoMode', 'false');
    console.log('🎭 Task Management Demo Mode DISABLED');
  }

  static getDemoModeStatus() {
    return this.isDemoMode();
  }
}

// Export both as named and default for compatibility
export { TaskService as default };