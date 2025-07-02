import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Popup } from 'devextreme-react/popup';
import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import axiosInstance from '../../../api/axiosInstance';
import notify from 'devextreme/ui/notify';

const TaskDetailsModal = ({ visible, task, onClose, onTaskUpdated }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const user = useSelector(state => state.auth.user);

  const isAdmin = user?.role === 'Admin';
  const isSupervisor = user?.role === 'Supervisor' || isAdmin;
  const canEdit = isSupervisor || task?.assignedTo === user?.id;

  const priorityOptions = [
    { value: 'Low', text: 'Low' },
    { value: 'Medium', text: 'Medium' },
    { value: 'High', text: 'High' },
    { value: 'Critical', text: 'Critical' }
  ];

  const statusOptions = [
    { value: 'Pending', text: 'Pending' },
    { value: 'In Progress', text: 'In Progress' },
    { value: 'Completed', text: 'Completed' },
    { value: 'Cancelled', text: 'Cancelled' }
  ];

  const typeOptions = [
    { value: 'Manual', text: 'Manual' },
    { value: 'Maintenance', text: 'Maintenance' },
    { value: 'Discrepancy', text: 'Discrepancy' },
    { value: 'Stock', text: 'Stock' },
    { value: 'Inspection', text: 'Inspection' },
    { value: 'Calibration', text: 'Calibration' },
    { value: 'TransactionCorrection', text: 'Transaction Correction' }
  ];

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        type: task.type || 'Manual',
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        completionNotes: task.completionNotes || ''
      });
      setEditMode(false);
    }
  }, [task]);

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      notify('Title is required', 'warning');
      return;
    }

    if (!formData.description?.trim()) {
      notify('Description is required', 'warning');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        type: typeOptions.find(t => t.text === formData.type)?.value || formData.type,
        priority: priorityOptions.find(p => p.text === formData.priority)?.value || formData.priority,
        status: statusOptions.find(s => s.text === formData.status)?.value || formData.status,
        dueDate: formData.dueDate?.toISOString(),
        completionNotes: formData.completionNotes
      };

      const response = await axiosInstance.put(`/api/task/${task.id}`, updateData);

      if (response.data.success) {
        notify('Task updated successfully', 'success');
        setEditMode(false);
        onTaskUpdated?.();
      } else {
        notify(response.data.message || 'Failed to update task', 'error');
      }
    } catch (error) {
      notify('Error updating task: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        type: task.type || 'Manual',
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        completionNotes: task.completionNotes || ''
      });
    }
    setEditMode(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'tw-text-red-600 tw-bg-red-50';
      case 'high': return 'tw-text-orange-600 tw-bg-orange-50';
      case 'medium': return 'tw-text-yellow-600 tw-bg-yellow-50';
      case 'low': return 'tw-text-green-600 tw-bg-green-50';
      default: return 'tw-text-gray-600 tw-bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'tw-text-green-600 tw-bg-green-50';
      case 'in progress': return 'tw-text-blue-600 tw-bg-blue-50';
      case 'pending': return 'tw-text-gray-600 tw-bg-gray-50';
      case 'overdue': return 'tw-text-red-600 tw-bg-red-50';
      case 'cancelled': return 'tw-text-gray-600 tw-bg-gray-50';
      default: return 'tw-text-gray-600 tw-bg-gray-50';
    }
  };

  if (!task) return null;

  return (
    <Popup
      visible={visible}
      title={editMode ? 'Edit Task' : 'Task Details'}
      width={700}
      height={600}
      showCloseButton={true}
      onHiding={onClose}
      dragEnabled={true}
      resizeEnabled={true}
    >
      <div className="tw-p-6">
        {/* Header with status and priority */}
        <div className="tw-flex tw-justify-between tw-items-start tw-mb-6">
          <div className="tw-flex tw-space-x-3">
            <span className={`tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority} Priority
            </span>
            <span className={`tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
          </div>

          {canEdit && (
            <div className="tw-flex tw-space-x-2">
              {!editMode ? (
                <Button
                  icon="fa-light fa-edit"
                  text="Edit"
                  type="default"
                  onClick={() => setEditMode(true)}
                />
              ) : (
                <>
                  <Button
                    text="Cancel"
                    type="normal"
                    onClick={handleCancel}
                  />
                  <Button
                    text="Save"
                    type="success"
                    onClick={handleSave}
                    disabled={loading}
                  />
                </>
              )}
            </div>
          )}
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
          {/* Left Column */}
          <div className="tw-space-y-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Title
              </label>
              {editMode ? (
                <TextBox
                  value={formData.title}
                  onValueChanged={(e) => setFormData({...formData, title: e.value})}
                />
              ) : (
                <p className="tw-text-gray-900 tw-font-medium">{task.title}</p>
              )}
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Type
              </label>
              {editMode ? (
                <SelectBox
                  dataSource={typeOptions}
                  displayExpr="text"
                  valueExpr="text"
                  value={formData.type}
                  onValueChanged={(e) => setFormData({...formData, type: e.value})}
                />
              ) : (
                <p className="tw-text-gray-900">{task.type}</p>
              )}
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Priority
              </label>
              {editMode ? (
                <SelectBox
                  dataSource={priorityOptions}
                  displayExpr="text"
                  valueExpr="text"
                  value={formData.priority}
                  onValueChanged={(e) => setFormData({...formData, priority: e.value})}
                />
              ) : (
                <p className="tw-text-gray-900">{task.priority}</p>
              )}
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Status
              </label>
              {editMode ? (
                <SelectBox
                  dataSource={statusOptions}
                  displayExpr="text"
                  valueExpr="text"
                  value={formData.status}
                  onValueChanged={(e) => setFormData({...formData, status: e.value})}
                />
              ) : (
                <p className="tw-text-gray-900">{task.status}</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="tw-space-y-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Assigned To
              </label>
              <p className="tw-text-gray-900">{task.assignedToName || 'Unassigned'}</p>
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Due Date
              </label>
              {editMode ? (
                <DateBox
                  value={formData.dueDate}
                  onValueChanged={(e) => setFormData({...formData, dueDate: e.value})}
                  type="datetime"
                />
              ) : (
                <p className="tw-text-gray-900">
                  {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'}
                </p>
              )}
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Site
              </label>
              <p className="tw-text-gray-900">{task.siteName || 'N/A'}</p>
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Tank
              </label>
              <p className="tw-text-gray-900">{task.tankName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="tw-mt-6">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Description
          </label>
          {editMode ? (
            <TextArea
              value={formData.description}
              onValueChanged={(e) => setFormData({...formData, description: e.value})}
              height={100}
            />
          ) : (
            <p className="tw-text-gray-900 tw-whitespace-pre-wrap tw-bg-gray-50 tw-p-3 tw-rounded">
              {task.description}
            </p>
          )}
        </div>

        {/* Completion Notes */}
        {(task.completionNotes || editMode) && (
          <div className="tw-mt-6">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Completion Notes
            </label>
            {editMode ? (
              <TextArea
                value={formData.completionNotes}
                onValueChanged={(e) => setFormData({...formData, completionNotes: e.value})}
                height={80}
                placeholder="Add completion notes..."
              />
            ) : (
              <p className="tw-text-gray-900 tw-whitespace-pre-wrap tw-bg-gray-50 tw-p-3 tw-rounded">
                {task.completionNotes || 'No completion notes'}
              </p>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm tw-text-gray-600">
            <div>
              <span className="tw-font-medium">Created:</span> {' '}
              {new Date(task.createdOn).toLocaleString()}
            </div>
            <div>
              <span className="tw-font-medium">Created By:</span> {' '}
              {task.createdByName}
            </div>
            {task.assignedOn && (
              <div>
                <span className="tw-font-medium">Assigned:</span> {' '}
                {new Date(task.assignedOn).toLocaleString()}
              </div>
            )}
            {task.assignedByName && (
              <div>
                <span className="tw-font-medium">Assigned By:</span> {' '}
                {task.assignedByName}
              </div>
            )}
            {task.completedOn && (
              <div>
                <span className="tw-font-medium">Completed:</span> {' '}
                {new Date(task.completedOn).toLocaleString()}
              </div>
            )}
            {task.sourceType && (
              <div>
                <span className="tw-font-medium">Source:</span> {' '}
                {task.sourceType} #{task.sourceId}
              </div>
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default TaskDetailsModal;