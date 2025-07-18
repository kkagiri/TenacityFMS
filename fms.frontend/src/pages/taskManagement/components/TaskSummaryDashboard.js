import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PieChart, Series, Label, Size } from 'devextreme-react/pie-chart';
import { Chart, ArgumentAxis, ValueAxis, CommonSeriesSettings, Legend, Tooltip } from 'devextreme-react/chart';
import notify from 'devextreme/ui/notify';

const TaskSummaryDashboard = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState({
    tasksByStatus: [],
    tasksByPriority: [],
    tasksByType: [],
    overdueTasks: [],
    recentActivity: [],
    performanceMetrics: {}
  });
  const [loading, setLoading] = useState(false);

  const user = useSelector(state => state.auth.user);
  const isSupervisor = user?.role === 'Supervisor' || user?.role === 'Admin';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API calls
      const mockData = {
        tasksByStatus: [
          { status: 'Pending', count: 15, color: '#f59e0b' },
          { status: 'In Progress', count: 8, color: '#3b82f6' },
          { status: 'Completed', count: 42, color: '#10b981' },
          { status: 'Cancelled', count: 3, color: '#ef4444' }
        ],
        tasksByPriority: [
          { priority: 'Critical', count: 2, color: '#dc2626' },
          { priority: 'High', count: 8, color: '#f97316' },
          { priority: 'Medium', count: 18, color: '#eab308' },
          { priority: 'Low', count: 15, color: '#22c55e' }
        ],
        tasksByType: [
          { type: 'Maintenance', count: 12, color: '#8b5cf6' },
          { type: 'Discrepancy', count: 8, color: '#ec4899' },
          { type: 'Stock', count: 15, color: '#06b6d4' },
          { type: 'Manual', count: 10, color: '#84cc16' }
        ],
        overdueTasks: [
          { id: 1, title: 'Tank 3 Calibration', daysOverdue: 2, priority: 'High' },
          { id: 2, title: 'Pump 2 Maintenance', daysOverdue: 1, priority: 'Medium' },
          { id: 3, title: 'Stock Reconciliation', daysOverdue: 3, priority: 'Critical' }
        ],
        performanceMetrics: {
          completionRate: 85,
          averageCompletionTime: 4.2,
          totalActiveTasks: 23,
          todayCompleted: 5
        }
      };

      setDashboardData(mockData);
    } catch (error) {
      notify('Failed to load dashboard data', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const renderMetricCard = (title, value, subtitle, icon, color = 'blue') => {
    const colorClasses = {
      blue: 'tw-bg-blue-50 tw-text-blue-600',
      green: 'tw-bg-green-50 tw-text-green-600',
      orange: 'tw-bg-orange-50 tw-text-orange-600',
      red: 'tw-bg-red-50 tw-text-red-600'
    };

    return (
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <p className="tw-text-sm tw-font-medium tw-text-gray-600">{title}</p>
            <p className="tw-text-2xl tw-font-bold tw-text-gray-900">{value}</p>
            {subtitle && (
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`tw-p-3 tw-rounded-full ${colorClasses[color]}`}>
            <i className={`${icon} tw-text-xl`}></i>
          </div>
        </div>
      </div>
    );
  };

  const renderOverdueTasksList = () => {
    if (!dashboardData.overdueTasks.length) {
      return (
        <div className="tw-text-center tw-py-8 tw-text-gray-500">
          <i className="fa-light fa-check-circle tw-text-4xl tw-mb-2"></i>
          <p>No overdue tasks!</p>
        </div>
      );
    }

    return (
      <div className="tw-space-y-3">
        {dashboardData.overdueTasks.map((task) => (
          <div key={task.id} className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-red-50 tw-rounded-lg">
            <div>
              <h4 className="tw-font-medium tw-text-gray-900">{task.title}</h4>
              <p className="tw-text-sm tw-text-red-600">
                {task.daysOverdue} day{task.daysOverdue > 1 ? 's' : ''} overdue
              </p>
            </div>
            <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
              task.priority === 'Critical' ? 'tw-bg-red-100 tw-text-red-800' :
              task.priority === 'High' ? 'tw-bg-orange-100 tw-text-orange-800' :
              'tw-bg-yellow-100 tw-text-yellow-800'
            }`}>
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-96">
        <div className="tw-text-center">
          <i className="fa-light fa-spinner fa-spin tw-text-4xl tw-text-blue-600 tw-mb-4"></i>
          <p className="tw-text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-summary-dashboard tw-space-y-6">
      {/* Header */}
      <div className="tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">Task Analytics Dashboard</h3>
        <p className="tw-text-sm tw-text-gray-600">
          Overview of task performance and system metrics
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
        {renderMetricCard(
          'Active Tasks',
          dashboardData.performanceMetrics.totalActiveTasks,
          'Currently in progress',
          'fa-light fa-tasks',
          'blue'
        )}
        {renderMetricCard(
          'Completion Rate',
          `${dashboardData.performanceMetrics.completionRate}%`,
          'Last 30 days',
          'fa-light fa-chart-line',
          'green'
        )}
        {renderMetricCard(
          'Avg Completion Time',
          `${dashboardData.performanceMetrics.averageCompletionTime}h`,
          'Hours per task',
          'fa-light fa-clock',
          'orange'
        )}
        {renderMetricCard(
          'Completed Today',
          dashboardData.performanceMetrics.todayCompleted,
          'Tasks finished',
          'fa-light fa-check-circle',
          'green'
        )}
      </div>

      {/* Charts Row */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
        {/* Task Status Distribution */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
            Tasks by Status
          </h3>
          <PieChart
            dataSource={dashboardData.tasksByStatus}
            series={[{
              argumentField: 'status',
              valueField: 'count',
              label: {
                visible: true,
                format: {
                  type: 'percent',
                  precision: 1
                },
                connector: {
                  visible: true
                }
              }
            }]}
            height={250}
            palette={dashboardData.tasksByStatus.map(item => item.color)}
          >
            <Size height={250} />
            <Legend
              visible={true}
              horizontalAlignment="center"
              verticalAlignment="bottom"
            />
          </PieChart>
        </div>

        {/* Task Priority Distribution */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
            Tasks by Priority
          </h3>
          <PieChart
            dataSource={dashboardData.tasksByPriority}
            series={[{
              argumentField: 'priority',
              valueField: 'count',
              label: {
                visible: true,
                format: {
                  type: 'percent',
                  precision: 1
                }
              }
            }]}
            height={250}
            palette={dashboardData.tasksByPriority.map(item => item.color)}
          >
            <Size height={250} />
            <Legend
              visible={true}
              horizontalAlignment="center"
              verticalAlignment="bottom"
            />
          </PieChart>
        </div>

        {/* Task Type Distribution */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
            Tasks by Type
          </h3>
          <Chart
            dataSource={dashboardData.tasksByType}
            height={250}
            palette={dashboardData.tasksByType.map(item => item.color)}
          >
            <CommonSeriesSettings
              argumentField="type"
              valueField="count"
              type="bar"
            />
            <Series />
            <ArgumentAxis>
              <Label rotationAngle={-45} />
            </ArgumentAxis>
            <ValueAxis />
            <Tooltip enabled={true} />
          </Chart>
        </div>
      </div>

      {/* Overdue Tasks */}
      {isSupervisor && (
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
              <i className="fa-light fa-exclamation-triangle tw-text-red-500 tw-mr-2"></i>
              Overdue Tasks
            </h3>
            <span className="tw-bg-red-100 tw-text-red-800 tw-px-2 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium">
              {dashboardData.overdueTasks.length} overdue
            </span>
          </div>
          {renderOverdueTasksList()}
        </div>
      )}

      {/* Quick Actions for Supervisors */}
      {isSupervisor && (
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
            Quick Actions
          </h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
            <button
              className="tw-flex tw-items-center tw-gap-3 tw-p-4 tw-border tw-border-gray-200 tw-rounded-lg tw-hover:bg-gray-50 tw-transition-colors"
              onClick={() => onNavigate && onNavigate('create')}
            >
              <i className="fa-light fa-plus-circle tw-text-blue-600 tw-text-xl"></i>
              <div className="tw-text-left">
                <p className="tw-font-medium tw-text-gray-900">Create Task</p>
                <p className="tw-text-sm tw-text-gray-600">Add new manual task</p>
              </div>
            </button>
            <button
              className="tw-flex tw-items-center tw-gap-3 tw-p-4 tw-border tw-border-gray-200 tw-rounded-lg tw-hover:bg-gray-50 tw-transition-colors"
              onClick={() => onNavigate && onNavigate('all-tasks')}
            >
              <i className="fa-light fa-users tw-text-green-600 tw-text-xl"></i>
              <div className="tw-text-left">
                <p className="tw-font-medium tw-text-gray-900">Manage Tasks</p>
                <p className="tw-text-sm tw-text-gray-600">View and assign tasks</p>
              </div>
            </button>
            <button
              className="tw-flex tw-items-center tw-gap-3 tw-p-4 tw-border tw-border-gray-200 tw-rounded-lg tw-hover:bg-gray-50 tw-transition-colors"
              onClick={() => notify('Reports feature coming soon', 'info', 2000)}
            >
              <i className="fa-light fa-chart-bar tw-text-purple-600 tw-text-xl"></i>
              <div className="tw-text-left">
                <p className="tw-font-medium tw-text-gray-900">View Reports</p>
                <p className="tw-text-sm tw-text-gray-600">Task performance</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskSummaryDashboard;
