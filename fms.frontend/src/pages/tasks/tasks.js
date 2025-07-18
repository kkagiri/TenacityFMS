import React, { useState, useEffect } from 'react';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { Form } from 'devextreme-react/form';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { useSelector } from 'react-redux';
import TaskService from '../../services/taskService';
import './tasks.scss';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({});

  const user = useSelector(state => state.user);

  const columns = [
    {
      dataField: 'id',
      caption: 'ID',
      width: 80
    },
    {
      dataField: 'title',
      caption: 'Title'
    },
    {
      dataField: 'description',
      caption: 'Description'
    },
    {
      dataField: 'status',
      caption: 'Status',
      lookup: {
        dataSource: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        valueExpr: 'this',
        displayExpr: 'this'
      }
    },
    {
      dataField: 'priority',
      caption: 'Priority',
      lookup: {
        dataSource: ['Low', 'Medium', 'High', 'Critical'],
        valueExpr: 'this',
        displayExpr: 'this'
      }
    },
    {
      dataField: 'assignedTo',
      caption: 'Assigned To'
    },
    {
      dataField: 'dueDate',
      caption: 'Due Date',
      dataType: 'date'
    },
    {
      dataField: 'createdDate',
      caption: 'Created Date',
      dataType: 'datetime'
    }
  ];

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await TaskService.getTasks();
      if (response.success) {
        setTasks(response.data);
      } else {
        notify(response.message || 'Failed to load tasks', 'error');
      }
    } catch (error) {
      notify('Error loading tasks', 'error');
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddTask = () => {
    setSelectedTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'Pending',
      priority: 'Medium',
      assignedTo: '',
      dueDate: new Date()
    });
    setShowAddPopup(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setFormData({ ...task });
    setShowAddPopup(true);
  };

  const handleSaveTask = async () => {
    try {
      setLoading(true);
      let response;

      if (selectedTask) {
        response = await TaskService.updateTask(selectedTask.id, formData);
      } else {
        response = await TaskService.createTask(formData);
      }

      if (response.success) {
        notify(selectedTask ? 'Task updated successfully' : 'Task created successfully', 'success');
        setShowAddPopup(false);
        loadTasks();
      } else {
        notify(response.message || 'Failed to save task', 'error');
      }
    } catch (error) {
      notify('Error saving task', 'error');
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setLoading(true);
      const response = await TaskService.deleteTask(taskId);

      if (response.success) {
        notify('Task deleted successfully', 'success');
        loadTasks();
      } else {
        notify(response.message || 'Failed to delete task', 'error');
      }
    } catch (error) {
      notify('Error deleting task', 'error');
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const formItems = [
    {
      dataField: 'title',
      label: { text: 'Title' },
      isRequired: true
    },
    {
      dataField: 'description',
      label: { text: 'Description' },
      editorType: 'dxTextArea',
      editorOptions: {
        height: 100
      }
    },
    {
      dataField: 'status',
      label: { text: 'Status' },
      editorType: 'dxSelectBox',
      editorOptions: {
        items: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        value: 'Pending'
      }
    },
    {
      dataField: 'priority',
      label: { text: 'Priority' },
      editorType: 'dxSelectBox',
      editorOptions: {
        items: ['Low', 'Medium', 'High', 'Critical'],
        value: 'Medium'
      }
    },
    {
      dataField: 'assignedTo',
      label: { text: 'Assigned To' }
    },
    {
      dataField: 'dueDate',
      label: { text: 'Due Date' },
      editorType: 'dxDateBox'
    }
  ];

  return (
    <div className="tw-p-6">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800">Task Management</h1>
        <Button
          text="Add Task"
          type="default"
          stylingMode="contained"
          onClick={handleAddTask}
          icon="plus"
        />
      </div>

      <DataGrid
        dataSource={tasks}
        columns={columns}
        showBorders={true}
        showRowLines={true}
        showColumnLines={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        paging={{ pageSize: 20 }}
        pager={{
          showPageSizeSelector: true,
          allowedPageSizes: [10, 20, 50, 100],
          showInfo: true
        }}
        searchPanel={{ visible: true }}
        filterRow={{ visible: true }}
        headerFilter={{ visible: true }}
        selection={{ mode: 'single' }}
        onRowDblClick={(e) => handleEditTask(e.data)}
      >
        <Column
          type="buttons"
          width={110}
          buttons={[
            {
              hint: 'Edit',
              icon: 'edit',
              onClick: (e) => handleEditTask(e.row.data)
            },
            {
              hint: 'Delete',
              icon: 'trash',
              onClick: (e) => handleDeleteTask(e.row.data.id)
            }
          ]}
        />
      </DataGrid>

      <Popup
        visible={showAddPopup}
        onHiding={() => setShowAddPopup(false)}
        title={selectedTask ? 'Edit Task' : 'Add New Task'}
        width={500}
        height={600}
        showCloseButton={true}
      >
        <Form
          formData={formData}
          items={formItems}
          onFieldDataChanged={(e) => {
            setFormData({
              ...formData,
              [e.dataField]: e.value
            });
          }}
        />
        <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
          <Button
            text="Cancel"
            onClick={() => setShowAddPopup(false)}
          />
          <Button
            text="Save"
            type="default"
            stylingMode="contained"
            onClick={handleSaveTask}
          />
        </div>
      </Popup>

      <LoadPanel
        visible={loading}
        showIndicator={true}
        showPane={true}
        text="Processing..."
      />
    </div>
  );
};

export default TasksPage;
