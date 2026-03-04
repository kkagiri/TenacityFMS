import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { DataGrid, Column, FilterRow, HeaderFilter, Pager, Paging } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { DropDownButton } from 'devextreme-react/drop-down-button';
import TaskService from '../../../services/taskService';
import TaskDetailsModal from './TaskDetailsModal';
import notify from 'devextreme/ui/notify';

const AllTasksGrid = ({ onNavigate, onTaskUpdated }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  const user = useSelector(state => state.auth.user);
  const isAdmin = user?.role === 'Admin';

  const loadTasks = useCallback(async (page = 0, size = 20, filter = {}) => {
    setLoading(true);
    try {
      const response = await TaskService.getTasks({
        page: page + 1,
        pageSize: size,
        ...filter
      });
      setTasks(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      notify(error.message, 'error', 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks(currentPage, pageSize);
  }, [loadTasks, currentPage, pageSize]);

  const handleTaskAction = async (taskId, action, assignTo = null) => {
    try {
      if (action === 'assign' && assignTo) {
        await TaskService.assignTask(taskId, assignTo);
      } else {
        await TaskService.updateTaskStatus(taskId, action);
      }
      notify(`Task ${action} successfully`, 'success', 3000);
      loadTasks(currentPage, pageSize);
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error) {
      notify(error.message, 'error', 3000);
    }
  };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const handlePageChange = (e) => {
    setCurrentPage(e.component.pageIndex());
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

  const renderAssigneeCell = (cellData) => {
    const { assignedTo, assignedBy, assignedOn } = cellData.data;

    if (!assignedTo) {
      return <span className="tw-text-gray-500 tw-italic">Unassigned</span>;
    }

    return (
      <div>
        <div className="tw-font-medium">{assignedTo}</div>
        {assignedBy && (
          <div className="tw-text-xs tw-text-gray-500">
            by {assignedBy} on {new Date(assignedOn).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  const getActionItems = (task) => {
    const items = [
      {
        text: 'View Details',
        icon: 'fa-light fa-eye',
        onClick: () => handleViewDetails(task)
      }
    ];

    if (isAdmin || user?.role === 'Supervisor') {
      if (!task.assignedTo) {
        items.push({
          text: 'Assign Task',
          icon: 'fa-light fa-user-plus',
          onClick: () => {
            // TODO: Implement assignment modal
            notify('Assignment feature coming soon', 'info', 2000);
          }
        });
      }

      if (task.status === 'Pending') {
        items.push({
          text: 'Cancel Task',
          icon: 'fa-light fa-times',
          onClick: () => handleTaskAction(task.id, 'Cancelled')
        });
      }
    }

    return items;
  };

  const renderActionsCell = (cellData) => {
    const task = cellData.data;
    const actionItems = getActionItems(task);

    return (
      <DropDownButton
        text="Actions"
        icon="fa-light fa-cogs"
        dropDownOptions={{
          width: 180
        }}
        items={actionItems}
        keyExpr="text"
        displayExpr="text"
        onItemClick={(e) => e.itemData.onClick()}
      />
    );
  };

  const renderTypeCell = (cellData) => {
    const typeIcons = {
      'Maintenance': 'fa-light fa-wrench',
      'Discrepancy': 'fa-light fa-exclamation-triangle',
      'Stock': 'fa-light fa-boxes',
      'Manual': 'fa-light fa-hand'
    };

    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={`${typeIcons[cellData.value] || 'fa-light fa-tasks'} tw-text-gray-600`}></i>
        <span>{cellData.value}</span>
      </div>
    );
  };

  return (
    <div className="all-tasks-grid">
      <div className="tw-mb-6 tw-flex tw-justify-between tw-items-center">
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">All Tasks Overview</h3>
          <p className="tw-text-sm tw-text-gray-600">
            Total: {totalCount} tasks across all users
          </p>
        </div>
        <Button
          text="Refresh"
          icon="fa-light fa-refresh"
          type="normal"
          onClick={() => loadTasks(currentPage, pageSize)}
        />
      </div>

      <div className="tw-bg-white dark:tw-bg-gray-900 tw-rounded-lg tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm">
        <DataGrid
          dataSource={tasks}
          loading={loading}
          showBorders={false}
          showRowLines={true}
          showColumnLines={false}
          rowAlternationEnabled={true}
          columnAutoWidth={true}
          height="500px"
          remoteOperations={{
            paging: true,
            sorting: true,
            filtering: true
          }}
          onContentReady={handlePageChange}
        >
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />

          <Column
            dataField="title"
            caption="Task Title"
            width="20%"
          />
          <Column
            dataField="type"
            caption="Type"
            width="12%"
            cellRender={renderTypeCell}
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
            caption="Assignee"
            width="15%"
            cellRender={renderAssigneeCell}
            allowSorting={false}
            allowFiltering={false}
          />
          <Column
            dataField="sourceType"
            caption="Source"
            width="10%"
          />
          <Column
            dataField="dueDate"
            caption="Due Date"
            dataType="datetime"
            width="12%"
            format="MMM dd, HH:mm"
          />
          <Column
            dataField="createdOn"
            caption="Created"
            dataType="datetime"
            width="12%"
            format="MMM dd, HH:mm"
          />
          <Column
            caption="Actions"
            width="9%"
            cellRender={renderActionsCell}
            allowSorting={false}
            allowFiltering={false}
          />

          <Paging
            enabled={true}
            pageSize={pageSize}
            pageIndex={currentPage}
          />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={[10, 20, 50, 100]}
            showInfo={true}
            showNavigationButtons={true}
          />
        </DataGrid>
      </div>

      {showDetailsModal && (
        <TaskDetailsModal
          task={selectedTask}
          visible={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onTaskUpdated={() => loadTasks(currentPage, pageSize)}
        />
      )}
    </div>
  );
};

export default AllTasksGrid;
