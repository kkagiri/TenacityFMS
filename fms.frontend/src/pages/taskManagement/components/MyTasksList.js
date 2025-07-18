import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { TagBox } from 'devextreme-react/tag-box';
import TaskService from '../../../services/taskService';
import TaskDetailsModal from './TaskDetailsModal';
import notify from 'devextreme/ui/notify';

const MyTasksList = ({ onNavigate }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    priorities: [],
    types: []
  });

  const user = useSelector(state => state.auth.user);

  const taskTypes = [
    { value: 'Maintenance', text: 'Maintenance' },
    { value: 'Discrepancy', text: 'Discrepancy Investigation' },
    { value: 'Stock', text: 'Stock Operation' },
    { value: 'Manual', text: 'Manual Task' }
  ];

  const taskPriorities = [
    { value: 'Low', text: 'Low' },
    { value: 'Medium', text: 'Medium' },
    { value: 'High', text: 'High' },
    { value: 'Critical', text: 'Critical' }
  ];

  const taskStatuses = [
    { value: 'Pending', text: 'Pending' },
    { value: 'InProgress', text: 'In Progress' },
    { value: 'Completed', text: 'Completed' },
    { value: 'Cancelled', text: 'Cancelled' }
  ];

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const filter = {
        assignedTo: user?.email,
        ...filters
      };
      const response = await TaskService.getTasks(filter);
      setTasks(response.data || []);
    } catch (error) {
      notify(error.message, 'error', 3000);
    } finally {
      setLoading(false);
    }
  }, [user?.email, filters]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskAction = async (taskId, action) => {
    try {
      await TaskService.updateTaskStatus(taskId, action);
      notify(`Task ${action} successfully`, 'success', 3000);
      loadTasks();
    } catch (error) {
      notify(error.message, 'error', 3000);
    }
  };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const renderPriorityCell = (cellData) => {
    const priorityClass = {
      'Critical': 'tw-bg-red-100 tw-text-red-800',
      'High': 'tw-bg-orange-100 tw-text-orange-800',
      'Medium': 'tw-bg-yellow-100 tw-text-yellow-800',
      'Low': 'tw-bg-green-100 tw-text-green-800'
    };

    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${priorityClass[cellData.value] || ''}`}>
        {cellData.value}
      </span>
    );
  };

  const renderStatusCell = (cellData) => {
    const statusClass = {
      'Pending': 'tw-bg-gray-100 tw-text-gray-800',
      'InProgress': 'tw-bg-blue-100 tw-text-blue-800',
      'Completed': 'tw-bg-green-100 tw-text-green-800',
      'Cancelled': 'tw-bg-red-100 tw-text-red-800'
    };

    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${statusClass[cellData.value] || ''}`}>
        {cellData.value}
      </span>
    );
  };

  const renderActionsCell = (cellData) => {
    const task = cellData.data;

    return (
      <div className="tw-flex tw-gap-2">
        <Button
          text="View"
          type="default"
          stylingMode="text"
          icon="fa-light fa-eye"
          onClick={() => handleViewDetails(task)}
        />
        {task.status === 'Pending' && (
          <Button
            text="Start"
            type="default"
            stylingMode="text"
            icon="fa-light fa-play"
            onClick={() => handleTaskAction(task.id, 'InProgress')}
          />
        )}
        {task.status === 'InProgress' && (
          <Button
            text="Complete"
            type="success"
            stylingMode="text"
            icon="fa-light fa-check"
            onClick={() => handleTaskAction(task.id, 'Completed')}
          />
        )}
      </div>
    );
  };

  return (
    <div className="my-tasks-list">
      <div className="tw-mb-6 tw-flex tw-justify-between tw-items-start">
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">My Tasks</h3>
          <p className="tw-text-sm tw-text-gray-600">
            Tasks assigned to you: {tasks.length} active tasks
          </p>
        </div>
        <Button
          text="Refresh"
          icon="fa-light fa-refresh"
          type="normal"
          onClick={loadTasks}
        />
      </div>

      <div className="tw-mb-6 tw-bg-white tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
          <TagBox
            dataSource={taskStatuses}
            displayExpr="text"
            valueExpr="value"
            value={filters.status}
            onValueChanged={(e) => setFilters(prev => ({ ...prev, status: e.value }))}
            placeholder="Filter by Status"
            showSelectionControls={true}
            applyValueMode="useButtons"
          />
          <TagBox
            dataSource={taskPriorities}
            displayExpr="text"
            valueExpr="value"
            value={filters.priorities}
            onValueChanged={(e) => setFilters(prev => ({ ...prev, priorities: e.value }))}
            placeholder="Filter by Priority"
            showSelectionControls={true}
            applyValueMode="useButtons"
          />
          <TagBox
            dataSource={taskTypes}
            displayExpr="text"
            valueExpr="value"
            value={filters.types}
            onValueChanged={(e) => setFilters(prev => ({ ...prev, types: e.value }))}
            placeholder="Filter by Type"
            showSelectionControls={true}
            applyValueMode="useButtons"
          />
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
        <DataGrid
          dataSource={tasks}
          loading={loading}
          showBorders={false}
          showRowLines={true}
          showColumnLines={false}
          rowAlternationEnabled={true}
          columnAutoWidth={true}
          height="400px"
        >
          <Column
            dataField="title"
            caption="Task Title"
            width="25%"
          />
          <Column
            dataField="type"
            caption="Type"
            width="15%"
          />
          <Column
            dataField="priority"
            caption="Priority"
            width="10%"
            cellRender={renderPriorityCell}
          />
          <Column
            dataField="status"
            caption="Status"
            width="10%"
            cellRender={renderStatusCell}
          />
          <Column
            dataField="dueDate"
            caption="Due Date"
            dataType="datetime"
            width="15%"
            format="MMM dd, yyyy HH:mm"
          />
          <Column
            dataField="assignedOn"
            caption="Assigned On"
            dataType="datetime"
            width="15%"
            format="MMM dd, yyyy HH:mm"
          />
          <Column
            caption="Actions"
            width="10%"
            cellRender={renderActionsCell}
            allowSorting={false}
          />
        </DataGrid>
      </div>

      {showDetailsModal && (
        <TaskDetailsModal
          task={selectedTask}
          visible={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onTaskUpdated={loadTasks}
        />
      )}
    </div>
  );
};

export default MyTasksList;