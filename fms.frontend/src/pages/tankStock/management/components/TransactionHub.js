import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Eye,
  BarChart3,
  Settings,
  Plus,
  FileText,
  Bell,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Activity,
  Users,
  Target
} from 'lucide-react';
import { DataGrid } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { Popup } from 'devextreme-react/popup';
import { TextArea } from 'devextreme-react/text-area';
import notify from 'devextreme/ui/notify';
import axiosInstance from '../../../../api/axiosInstance';

//Cursor - Created comprehensive Transaction Hub with unified transaction correction and task management

const TransactionHub = ({ transactions, selectedSite, dateRange, onDateRangeChange, onTransactionUpdate }) => {
  const user = useSelector(state => state.auth.user);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionData, setTransactionData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [reconciliationStatus, setReconciliationStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [deletionImpact, setDeletionImpact] = useState(null);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    transactionType: 'all',
    taskStatus: 'all',
    priority: 'all',
    dateRange: dateRange || [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()]
  });

  // Permission checks
  const canCorrectTransactions = user?.permissions?.includes('_editStock') && user?.role === 'Admin';
  const canManageTasks = ['Admin', 'Supervisor', 'User'].includes(user?.role);

  // Dashboard metrics state
  const [metrics, setMetrics] = useState({
    totalTransactions: 0,
    pendingCorrections: 0,
    activeTasks: 0,
    overdueItems: 0,
    reconciliationAlerts: 0,
    completionRate: 0
  });

  // Load data on component mount and when filters change
  useEffect(() => {
    loadDashboardData();
  }, [selectedSite, filters.dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTransactionData(),
        loadTaskData(),
        loadReconciliationStatus(),
        loadMetrics()
      ]);
    } catch (error) {
      notify('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionData = async () => {
    try {
      const response = await axiosInstance.get('/api/transactioncorrection/manual-transactions', {
        params: {
          siteId: selectedSite,
          startDate: filters.dateRange[0],
          endDate: filters.dateRange[1],
          type: filters.transactionType !== 'all' ? filters.transactionType : undefined
        }
      });
      setTransactionData(response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadTaskData = async () => {
    try {
      const response = await axiosInstance.get('/api/task', {
        params: {
          siteId: selectedSite,
          status: filters.taskStatus !== 'all' ? filters.taskStatus : undefined,
          priority: filters.priority !== 'all' ? filters.priority : undefined,
          assignedTo: activeTab === 'myTasks' ? user?.id : undefined
        }
      });
      setTaskData(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadReconciliationStatus = async () => {
    try {
      const response = await axiosInstance.get('/api/reconciliation/status', {
        params: { siteId: selectedSite }
      });
      setReconciliationStatus(response.data);
    } catch (error) {
      console.error('Error loading reconciliation status:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await axiosInstance.get('/api/operational-metrics', {
        params: { siteId: selectedSite }
      });
      setMetrics(response.data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  // Transaction correction functions
  const analyzeTransactionImpact = async (transactionId) => {
    try {
      const response = await axiosInstance.get(`/api/transactioncorrection/transaction/${transactionId}/deletion-impact`);
      setDeletionImpact(response.data);
      setSelectedTransaction(transactionId);
      setShowImpactModal(true);
    } catch (error) {
      notify('Error analyzing transaction impact', 'error');
    }
  };

  const deleteTransactionWithReconciliation = async (transactionId, reason) => {
    try {
      await axiosInstance.delete(`/api/transactioncorrection/transaction/${transactionId}`, {
        data: { reason }
      });
      notify('Transaction deleted successfully. Reconciliation triggered.', 'success');
      setShowImpactModal(false);
      loadDashboardData();
    } catch (error) {
      notify('Error deleting transaction', 'error');
    }
  };

  const editTransaction = async (transactionId) => {
    try {
      // Navigate to transaction edit page or open edit modal
      // For now, just show a notification that edit functionality is available
      notify(`Edit transaction ${transactionId}`, 'info');
      // TODO: Implement transaction editing functionality
      // This could open a modal or navigate to an edit page
    } catch (error) {
      notify('Error editing transaction', 'error');
    }
  };

  const completeTask = async (taskId, completionNotes) => {
    try {
      await axiosInstance.post(`/api/task/${taskId}/complete`, {
        completionNotes
      });
      notify('Task completed successfully', 'success');
      setShowTaskModal(false);
      loadDashboardData();
    } catch (error) {
      notify('Error completing task', 'error');
    }
  };

  const assignTask = async (taskId, assigneeId) => {
    try {
      await axiosInstance.post(`/api/task/${taskId}/assign`, {
        assignedTo: assigneeId
      });
      notify('Task assigned successfully', 'success');
      loadDashboardData();
    } catch (error) {
      notify('Error assigning task', 'error');
    }
  };

  // UI Components
  const MetricsCard = ({ icon: Icon, title, value, trend, color = 'blue' }) => (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-p-4">
      <div className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-space-x-3">
          <div className={`tw-p-2 tw-rounded-lg tw-bg-${color}-50`}>
            <Icon className={`tw-w-5 tw-h-5 tw-text-${color}-600`} />
          </div>
          <div>
            <p className="tw-text-sm tw-font-medium tw-text-gray-600">{title}</p>
            <p className="tw-text-2xl tw-font-bold tw-text-gray-900">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`tw-flex tw-items-center tw-text-sm tw-font-medium ${
            trend > 0 ? 'tw-text-green-600' : 'tw-text-red-600'
          }`}>
            <TrendingUp className="tw-w-4 tw-h-4 tw-mr-1" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );

  const TransactionGrid = () => {
    const columns = [
      {
        dataField: 'id',
        caption: 'Transaction ID',
        width: 120,
        cellRender: ({ data }) => (
          <span className="tw-font-mono tw-text-sm">#{data.id}</span>
        )
      },
      {
        dataField: 'timestamp',
        caption: 'Date/Time',
        dataType: 'datetime',
        width: 160
      },
      {
        dataField: 'tankName',
        caption: 'Tank',
        width: 100
      },
      {
        dataField: 'changeReason',
        caption: 'Type',
        width: 120,
        cellRender: ({ data }) => (
          <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
            data.changeReason === 'Dispensing' ? 'tw-bg-blue-100 tw-text-blue-800' :
            data.changeReason === 'Adjustment' ? 'tw-bg-yellow-100 tw-text-yellow-800' :
            'tw-bg-gray-100 tw-text-gray-800'
          }`}>
            {data.changeReason}
          </span>
        )
      },
      {
        dataField: 'volumeChange',
        caption: 'Volume Change (L)',
        dataType: 'number',
        format: '#,##0.00'
      },
      {
        dataField: 'newVolume',
        caption: 'Balance After (L)',
        dataType: 'number',
        format: '#,##0.00'
      },
      {
        dataField: 'recordedBy',
        caption: 'Recorded By',
        width: 120
      },
      {
        caption: 'Actions',
        width: 200,
        cellRender: ({ data }) => (
          <div className="tw-flex tw-space-x-2">
            <Button
              icon={() => <Eye className="tw-w-4 tw-h-4" />}
              hint="Analyze Impact"
              onClick={() => analyzeTransactionImpact(data.id)}
              size="small"
              type="default"
            />
            <Button
              icon={() => <Edit3 className="tw-w-4 tw-h-4" />}
              hint="Edit Transaction"
              onClick={() => editTransaction(data.id)}
              size="small"
              type="default"
              disabled={!canCorrectTransactions}
            />
            <Button
              icon={() => <Trash2 className="tw-w-4 tw-h-4" />}
              hint="Delete Transaction"
              onClick={() => analyzeTransactionImpact(data.id)}
              size="small"
              type="danger"
              disabled={!canCorrectTransactions}
            />
          </div>
        )
      }
    ];

    return (
      <DataGrid
        dataSource={transactionData}
        columns={columns}
        showBorders={true}
        showRowLines={true}
        showColumnLines={false}
        rowAlternationEnabled={true}
        paging={{ pageSize: 20 }}
        filterRow={{ visible: true }}
        searchPanel={{
          visible: true,
          placeholder: "Search transactions...",
          width: 300
        }}
        selection={{ mode: 'single' }}
        hoverStateEnabled={true}
        className="tw-bg-white tw-rounded-lg tw-shadow-sm"
      />
    );
  };

  const TaskGrid = () => {
    const columns = [
      {
        dataField: 'id',
        caption: 'Task ID',
        width: 80,
        cellRender: ({ data }) => (
          <span className="tw-font-mono tw-text-sm">#{data.id}</span>
        )
      },
      {
        dataField: 'title',
        caption: 'Title',
        width: 250
      },
      {
        dataField: 'type',
        caption: 'Type',
        width: 120,
        cellRender: ({ data }) => (
          <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
            data.type === 'Discrepancy' ? 'tw-bg-red-100 tw-text-red-800' :
            data.type === 'TransactionCorrection' ? 'tw-bg-blue-100 tw-text-blue-800' :
            data.type === 'Maintenance' ? 'tw-bg-yellow-100 tw-text-yellow-800' :
            'tw-bg-gray-100 tw-text-gray-800'
          }`}>
            {data.type}
          </span>
        )
      },
      {
        dataField: 'priority',
        caption: 'Priority',
        width: 100,
        cellRender: ({ data }) => (
          <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
            data.priority === 'Critical' ? 'tw-bg-red-100 tw-text-red-800' :
            data.priority === 'High' ? 'tw-bg-orange-100 tw-text-orange-800' :
            data.priority === 'Medium' ? 'tw-bg-yellow-100 tw-text-yellow-800' :
            'tw-bg-green-100 tw-text-green-800'
          }`}>
            {data.priority}
          </span>
        )
      },
      {
        dataField: 'status',
        caption: 'Status',
        width: 120,
        cellRender: ({ data }) => (
          <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
            data.status === 'Completed' ? 'tw-bg-green-100 tw-text-green-800' :
            data.status === 'InProgress' ? 'tw-bg-blue-100 tw-text-blue-800' :
            data.status === 'Overdue' ? 'tw-bg-red-100 tw-text-red-800' :
            'tw-bg-gray-100 tw-text-gray-800'
          }`}>
            {data.status}
          </span>
        )
      },
      {
        dataField: 'assignedTo',
        caption: 'Assigned To',
        width: 120
      },
      {
        dataField: 'dueDate',
        caption: 'Due Date',
        dataType: 'datetime',
        width: 140
      },
      {
        caption: 'Actions',
        width: 150,
        cellRender: ({ data }) => (
          <div className="tw-flex tw-space-x-2">
            <Button
              icon={() => <Eye className="tw-w-4 tw-h-4" />}
              hint="View Details"
              onClick={() => {
                setSelectedTask(data);
                setShowTaskModal(true);
              }}
              size="small"
              type="default"
            />
            {data.status !== 'Completed' && (
              <Button
                icon={() => <CheckCircle className="tw-w-4 tw-h-4" />}
                hint="Complete Task"
                onClick={() => {
                  setSelectedTask(data);
                  setShowTaskModal(true);
                }}
                size="small"
                type="success"
                disabled={!canManageTasks}
              />
            )}
          </div>
        )
      }
    ];

    return (
      <DataGrid
        dataSource={taskData}
        columns={columns}
        showBorders={true}
        showRowLines={true}
        showColumnLines={false}
        rowAlternationEnabled={true}
        paging={{ pageSize: 20 }}
        filterRow={{ visible: true }}
        searchPanel={{
          visible: true,
          placeholder: "Search tasks...",
          width: 300
        }}
        selection={{ mode: 'single' }}
        hoverStateEnabled={true}
        className="tw-bg-white tw-rounded-lg tw-shadow-sm"
      />
    );
  };

  const OverviewDashboard = () => (
    <div className="tw-space-y-6">
      {/* Metrics Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
        <MetricsCard
          icon={Activity}
          title="Total Transactions"
          value={metrics.totalTransactions}
          color="blue"
        />
        <MetricsCard
          icon={AlertTriangle}
          title="Pending Corrections"
          value={metrics.pendingCorrections}
          color="orange"
        />
        <MetricsCard
          icon={Target}
          title="Active Tasks"
          value={metrics.activeTasks}
          color="green"
        />
        <MetricsCard
          icon={Clock}
          title="Overdue Items"
          value={metrics.overdueItems}
          color="red"
        />
      </div>

      {/* Quick Actions */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-p-6">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center">
          <Settings className="tw-w-5 tw-h-5 tw-mr-2" />
          Quick Actions
        </h3>
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
          <Button
            icon={() => <Plus className="tw-w-4 tw-h-4" />}
            text="Create Manual Task"
            onClick={() => setActiveTab('createTask')}
            className="tw-h-12"
            disabled={!canManageTasks}
          />
          <Button
            icon={() => <RefreshCw className="tw-w-4 tw-h-4" />}
            text="Trigger Reconciliation"
            onClick={() => setActiveTab('reconciliation')}
            className="tw-h-12"
            disabled={!canCorrectTransactions}
          />
          <Button
            icon={() => <BarChart3 className="tw-w-4 tw-h-4" />}
            text="Generate Report"
            onClick={() => setActiveTab('reports')}
            className="tw-h-12"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center">
            <FileText className="tw-w-5 tw-h-5 tw-mr-2" />
            Recent Corrections
          </h3>
          <div className="tw-space-y-3">
            {transactionData.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                <div>
                  <p className="tw-font-medium">Transaction #{transaction.id}</p>
                  <p className="tw-text-sm tw-text-gray-600">{transaction.tankName} - {transaction.changeReason}</p>
                </div>
                <ArrowRight className="tw-w-4 tw-h-4 tw-text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center">
            <Bell className="tw-w-5 tw-h-5 tw-mr-2" />
            Active Tasks
          </h3>
          <div className="tw-space-y-3">
            {taskData.filter(task => task.status !== 'Completed').slice(0, 5).map((task) => (
              <div key={task.id} className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                <div>
                  <p className="tw-font-medium">{task.title}</p>
                  <p className="tw-text-sm tw-text-gray-600">
                    {task.priority} Priority - Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <ArrowRight className="tw-w-4 tw-h-4 tw-text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Tab configuration
  const tabs = [
    {
      key: 'overview',
      title: 'Overview',
      icon: BarChart3,
      component: <OverviewDashboard />,
      visible: true
    },
    {
      key: 'transactions',
      title: 'Transaction Corrections',
      icon: Edit3,
      component: (
        <div className="tw-space-y-4">
          <div className="tw-flex tw-justify-between tw-items-center">
            <h3 className="tw-text-lg tw-font-semibold">Manual Transaction Corrections</h3>
            <Button
              icon={() => <RefreshCw className="tw-w-4 tw-h-4" />}
              text="Refresh"
              onClick={loadTransactionData}
              loading={loading}
            />
          </div>
          <TransactionGrid />
        </div>
      ),
      visible: canCorrectTransactions
    },
    {
      key: 'tasks',
      title: 'All Tasks',
      icon: Target,
      component: (
        <div className="tw-space-y-4">
          <div className="tw-flex tw-justify-between tw-items-center">
            <h3 className="tw-text-lg tw-font-semibold">Task Management</h3>
            <Button
              icon={() => <Plus className="tw-w-4 tw-h-4" />}
              text="Create Task"
              onClick={() => setActiveTab('createTask')}
              disabled={!canManageTasks}
            />
          </div>
          <TaskGrid />
        </div>
      ),
      visible: canManageTasks
    },
    {
      key: 'myTasks',
      title: 'My Tasks',
      icon: User,
      component: (
        <div className="tw-space-y-4">
          <div className="tw-flex tw-justify-between tw-items-center">
            <h3 className="tw-text-lg tw-font-semibold">My Assigned Tasks</h3>
            <Button
              icon={() => <RefreshCw className="tw-w-4 tw-h-4" />}
              text="Refresh"
              onClick={loadTaskData}
              loading={loading}
            />
          </div>
          <TaskGrid />
        </div>
      ),
      visible: true
    }
  ];

  return (
    <div className="tw-p-6 tw-bg-gray-50 tw-min-h-screen">
      {/* Header */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-p-6 tw-mb-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-flex tw-items-center">
              <Activity className="tw-w-6 tw-h-6 tw-mr-3 tw-text-blue-600" />
              Operational Management Hub
            </h1>
            <p className="tw-text-gray-600 tw-mt-1">
              Unified transaction correction and task management system
            </p>
          </div>
          <div className="tw-flex tw-items-center tw-space-x-4">
            <SelectBox
              dataSource={['all', 'Dispensing', 'Adjustment', 'Delivery']}
              value={filters.transactionType}
              onValueChanged={(e) => setFilters({...filters, transactionType: e.value})}
              placeholder="Filter by type"
              width={150}
            />
            <DateBox
              value={filters.dateRange[0]}
              onValueChanged={(e) => setFilters({
                ...filters,
                dateRange: [e.value, filters.dateRange[1]]
              })}
              placeholder="Start Date"
              width={120}
            />
            <DateBox
              value={filters.dateRange[1]}
              onValueChanged={(e) => setFilters({
                ...filters,
                dateRange: [filters.dateRange[0], e.value]
              })}
              placeholder="End Date"
              width={120}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-mb-6">
        <div className="tw-flex tw-border-b">
          {tabs.filter(tab => tab.visible).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tw-flex tw-items-center tw-px-6 tw-py-4 tw-font-medium tw-text-sm tw-border-b-2 tw-transition-colors ${
                activeTab === tab.key
                  ? 'tw-border-blue-500 tw-text-blue-600 tw-bg-blue-50'
                  : 'tw-border-transparent tw-text-gray-500 hover:tw-text-gray-700 hover:tw-border-gray-300'
              }`}
            >
              <tab.icon className="tw-w-4 tw-h-4 tw-mr-2" />
              {tab.title}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tw-min-h-96">
        {tabs.find(tab => tab.key === activeTab)?.component}
      </div>

      {/* Impact Analysis Modal */}
      <Popup
        visible={showImpactModal}
        onHiding={() => setShowImpactModal(false)}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Transaction Deletion Impact Analysis"
        width={600}
        height={500}
      >
        {deletionImpact && (
          <div className="tw-p-4 tw-space-y-4">
            <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-4">
              <div className="tw-flex tw-items-center tw-mb-2">
                <AlertTriangle className="tw-w-5 tw-h-5 tw-text-yellow-600 tw-mr-2" />
                <h3 className="tw-font-semibold tw-text-yellow-800">Impact Analysis</h3>
              </div>
              <ul className="tw-space-y-2 tw-text-sm tw-text-yellow-700">
                <li>• Affected subsequent transactions: {deletionImpact.affectedSubsequentTransactions}</li>
                <li>• Volume change impact: {deletionImpact.currentTankStockChange}L</li>
                <li>• Reconciliation required: {deletionImpact.requiresReconciliation ? 'Yes' : 'No'}</li>
              </ul>
            </div>

            <TextArea
              placeholder="Please provide a reason for deletion..."
              height={100}
              onValueChanged={(e) => setDeletionImpact({...deletionImpact, reason: e.value})}
            />

            <div className="tw-flex tw-justify-end tw-space-x-2">
              <Button
                text="Cancel"
                onClick={() => setShowImpactModal(false)}
                type="normal"
              />
              <Button
                text="Confirm Deletion"
                onClick={() => deleteTransactionWithReconciliation(selectedTransaction, deletionImpact.reason)}
                type="danger"
                disabled={!deletionImpact.reason}
              />
            </div>
          </div>
        )}
      </Popup>

      {/* Task Details Modal */}
      <Popup
        visible={showTaskModal}
        onHiding={() => setShowTaskModal(false)}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Task Details"
        width={600}
        height={500}
      >
        {selectedTask && (
          <div className="tw-p-4 tw-space-y-4">
            <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
              <h3 className="tw-font-semibold tw-mb-2">{selectedTask.title}</h3>
              <p className="tw-text-gray-600 tw-mb-4">{selectedTask.description}</p>

              <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
                <div>
                  <span className="tw-font-medium">Type:</span> {selectedTask.type}
                </div>
                <div>
                  <span className="tw-font-medium">Priority:</span> {selectedTask.priority}
                </div>
                <div>
                  <span className="tw-font-medium">Status:</span> {selectedTask.status}
                </div>
                <div>
                  <span className="tw-font-medium">Due Date:</span> {new Date(selectedTask.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            {selectedTask.status !== 'Completed' && (
              <TextArea
                placeholder="Completion notes..."
                height={100}
                onValueChanged={(e) => setSelectedTask({...selectedTask, completionNotes: e.value})}
              />
            )}

            <div className="tw-flex tw-justify-end tw-space-x-2">
              <Button
                text="Close"
                onClick={() => setShowTaskModal(false)}
                type="normal"
              />
              {selectedTask.status !== 'Completed' && (
                <Button
                  text="Complete Task"
                  onClick={() => completeTask(selectedTask.id, selectedTask.completionNotes)}
                  type="success"
                  disabled={!selectedTask.completionNotes}
                />
              )}
            </div>
          </div>
        )}
      </Popup>
    </div>
  );
};

TransactionHub.propTypes = {
  transactions: PropTypes.array,
  selectedSite: PropTypes.string,
  dateRange: PropTypes.array,
  onDateRangeChange: PropTypes.func,
  onTransactionUpdate: PropTypes.func
};

export default TransactionHub;