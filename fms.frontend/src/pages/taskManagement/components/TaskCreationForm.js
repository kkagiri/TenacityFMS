import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';
import { DateBox } from 'devextreme-react/date-box';
import TaskService from '../../../services/taskService';
import notify from 'devextreme/ui/notify';
import './TaskCreationForm.scss';

// Static data moved outside component to avoid dependency issues
const taskTypes = [
  { value: 'Manual', text: 'Manual Task', icon: 'fa-light fa-hand-paper', description: 'General manual task' },
  { value: 'Maintenance', text: 'Maintenance', icon: 'fa-light fa-wrench', description: 'Equipment maintenance' },
  { value: 'Discrepancy', text: 'Discrepancy Investigation', icon: 'fa-light fa-search', description: 'Stock discrepancy investigation' },
  { value: 'Stock', text: 'Stock Operation', icon: 'fa-light fa-boxes', description: 'Stock reconciliation' },
  { value: 'Calibration', text: 'Equipment Calibration', icon: 'fa-light fa-gauge', description: 'Gauge calibration' },
  { value: 'Inspection', text: 'Safety Inspection', icon: 'fa-light fa-shield-check', description: 'Safety and compliance check' }
];

const taskPriorities = [
  { value: 'Low', text: 'Low Priority', color: 'tw-bg-green-100 tw-text-green-800', icon: 'fa-light fa-chevron-down' },
  { value: 'Medium', text: 'Medium Priority', color: 'tw-bg-yellow-100 tw-text-yellow-800', icon: 'fa-light fa-minus' },
  { value: 'High', text: 'High Priority', color: 'tw-bg-orange-100 tw-text-orange-800', icon: 'fa-light fa-chevron-up' },
  { value: 'Critical', text: 'Critical Priority', color: 'tw-bg-red-100 tw-text-red-800', icon: 'fa-light fa-exclamation-triangle' }
];

const sampleSites = [
  { id: 1, name: 'Main Station', tanks: ['Tank A1', 'Tank A2', 'Tank A3', 'Tank A4', 'Tank A5'] },
  { id: 2, name: 'North Branch', tanks: ['Tank B1', 'Tank B2', 'Tank B3'] },
  { id: 3, name: 'South Branch', tanks: ['Tank C1', 'Tank C2'] }
];

const sampleUsers = [
  { id: 'alice', name: 'Alice Johnson', email: 'alice@fms.com', workload: 3, skills: ['Discrepancy Investigation', 'ATG Systems'] },
  { id: 'bob', name: 'Bob Smith', email: 'bob@fms.com', workload: 5, skills: ['Maintenance', 'Pump Systems'] },
  { id: 'carol', name: 'Carol Davis', email: 'carol@fms.com', workload: 1, skills: ['Inspection', 'General Operations'] },
  { id: 'mike', name: 'Mike Wilson', email: 'mike@fms.com', workload: 2, skills: ['Calibration', 'Technical'] }
];

const TaskCreationForm = ({ onTaskCreated, onNavigate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Manual',
    priority: 'Medium',
    assignedTo: '',
    dueDate: null,
    sourceType: 'Manual',
    sourceId: null,
    siteId: null,
    tankId: null,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const user = useSelector(state => state.auth?.user);

  // Debug: Log data sources to console
  useEffect(() => {
    console.log('TaskCreationForm - Data sources:');
    console.log('Task Types:', taskTypes);
    console.log('Task Priorities:', taskPriorities);
    console.log('Sample Sites:', sampleSites);
    console.log('Sample Users:', sampleUsers);
  }, []);

const TaskCreationForm = ({ onTaskCreated, onNavigate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Manual',
    priority: 'Medium',
    assignedTo: '',
    dueDate: null,
    sourceType: 'Manual',
    sourceId: null,
    siteId: null,
    tankId: null,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [tanks, setTanks] = useState([]);

  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        // Set sample data for demo
        setAvailableUsers(sampleUsers);
        setSites(sampleSites);

        // Generate tanks based on sites
        const allTanks = sampleSites.flatMap(site =>
          site.tanks.map((tank, index) => ({
            id: `${site.id}-${index + 1}`,
            name: tank,
            siteId: site.id,
            siteName: site.name
          }))
        );
        setTanks(allTanks);
      } catch (error) {
        notify('Failed to load form data', 'error', 3000);
      }
    };

    loadFormData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      notify('Task title is required', 'error', 3000);
      return;
    }

    if (!formData.description?.trim()) {
      notify('Task description is required', 'error', 3000);
      return;
    }

    setLoading(true);

    try {
      const taskData = {
        ...formData,
        assignedBy: user?.email || 'demo@fms.com',
        createdBy: user?.email || 'demo@fms.com',
        siteName: sites.find(s => s.id === formData.siteId)?.name,
        tankName: tanks.find(t => t.id === formData.tankId)?.name
      };

      await TaskService.createTask(taskData);
      notify('Task created successfully!', 'success', 3000);

      // Reset form
      handleReset();

      // Navigate and notify parent
      if (onTaskCreated) {
        onTaskCreated();
      }
      if (onNavigate) {
        onNavigate('all-tasks');
      }
    } catch (error) {
      notify(error.message || 'Failed to create task', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      type: 'Manual',
      priority: 'Medium',
      assignedTo: '',
      dueDate: null,
      sourceType: 'Manual',
      sourceId: null,
      siteId: null,
      tankId: null,
      notes: ''
    });
  };

  const getFilteredTanks = () => {
    if (!formData.siteId) return [];
    return tanks.filter(tank => tank.siteId === formData.siteId);
  };

  const getWorkloadColor = (workload) => {
    if (workload >= 5) return 'tw-text-red-600';
    if (workload >= 3) return 'tw-text-yellow-600';
    return 'tw-text-green-600';
  };

  return (
    <div className="task-creation-form tw-p-6 tw-bg-gray-50 tw-min-h-screen">
      <div className="tw-max-w-7xl tw-mx-auto">
        {/* Header */}
        <div className="tw-mb-6">
          <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-2">
            <i className="fa-light fa-plus tw-mr-2"></i>
            Create New Task
          </h2>
          <p className="tw-text-gray-600">Create and assign a new task to team members</p>
        </div>

        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
          {/* Main Form */}
          <div className="lg:tw-col-span-2">
            <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="tw-mb-8">
                  <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4 tw-flex tw-items-center">
                    <i className="fa-light fa-info-circle tw-mr-2"></i>
                    Task Details
                  </h3>

                  <div className="tw-space-y-4">
                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                        Task Title *
                      </label>
                      <TextBox
                        value={formData.title}
                        onValueChanged={(e) => setFormData(prev => ({ ...prev, title: e.value }))}
                        placeholder="Enter task title..."
                        width="100%"
                        stylingMode="outlined"
                      />
                    </div>

                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                        Description *
                      </label>
                      <TextArea
                        value={formData.description}
                        onValueChanged={(e) => setFormData(prev => ({ ...prev, description: e.value }))}
                        placeholder="Describe the task in detail..."
                        height={100}
                        width="100%"
                        stylingMode="outlined"
                      />
                    </div>

                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                      <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                          Task Type *
                        </label>
                        <SelectBox
                          value={formData.type}
                          onValueChanged={(e) => setFormData(prev => ({ ...prev, type: e.value }))}
                          dataSource={taskTypes}
                          displayExpr="text"
                          valueExpr="value"
                          width="100%"
                          placeholder="Select task type"
                          stylingMode="outlined"
                          showClearButton={true}
                          searchEnabled={false}
                          noDataText="No task types available"
                        />
                      </div>

                      <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                          Priority *
                        </label>
                        <SelectBox
                          value={formData.priority}
                          onValueChanged={(e) => setFormData(prev => ({ ...prev, priority: e.value }))}
                          dataSource={taskPriorities}
                          displayExpr="text"
                          valueExpr="value"
                          width="100%"
                          placeholder="Select priority"
                          stylingMode="outlined"
                          showClearButton={true}
                          searchEnabled={false}
                          noDataText="No priorities available"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="tw-mb-8">
                  <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4 tw-flex tw-items-center">
                    <i className="fa-light fa-map-marker-alt tw-mr-2"></i>
                    Location
                  </h3>

                  <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                        Site *
                      </label>
                      <SelectBox
                        value={formData.siteId}
                        onValueChanged={(e) => setFormData(prev => ({ ...prev, siteId: e.value, tankId: null }))}
                        dataSource={sites}
                        displayExpr="name"
                        valueExpr="id"
                        placeholder="Select site"
                        width="100%"
                        stylingMode="outlined"
                        showClearButton={true}
                        searchEnabled={false}
                        noDataText="No sites available"
                      />
                    </div>

                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                        Tank (Optional)
                      </label>
                      <SelectBox
                        value={formData.tankId}
                        onValueChanged={(e) => setFormData(prev => ({ ...prev, tankId: e.value }))}
                        dataSource={getFilteredTanks()}
                        displayExpr="name"
                        valueExpr="id"
                        placeholder="Select tank"
                        disabled={!formData.siteId}
                        width="100%"
                        stylingMode="outlined"
                        showClearButton={true}
                        searchEnabled={false}
                        noDataText="No tanks available"
                      />
                    </div>
                  </div>
                </div>

                {/* Assignment & Scheduling */}
                <div className="tw-mb-8">
                  <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4 tw-flex tw-items-center">
                    <i className="fa-light fa-user tw-mr-2"></i>
                    Assignment & Scheduling
                  </h3>

                  <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                        Assign To
                      </label>
                      <SelectBox
                        value={formData.assignedTo}
                        onValueChanged={(e) => setFormData(prev => ({ ...prev, assignedTo: e.value }))}
                        dataSource={availableUsers}
                        displayExpr="name"
                        valueExpr="email"
                        placeholder="Select assignee or leave unassigned"
                        width="100%"
                        stylingMode="outlined"
                        showClearButton={true}
                        searchEnabled={true}
                        noDataText="No users available"
                      />
                    </div>

                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                        Due Date
                      </label>
                      <DateBox
                        value={formData.dueDate}
                        onValueChanged={(e) => setFormData(prev => ({ ...prev, dueDate: e.value }))}
                        type="datetime"
                        placeholder="Select due date"
                        width="100%"
                        stylingMode="outlined"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="tw-mb-8">
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                    Additional Notes
                  </label>
                  <TextArea
                    value={formData.notes}
                    onValueChanged={(e) => setFormData(prev => ({ ...prev, notes: e.value }))}
                    placeholder="Add any additional instructions or notes..."
                    height={80}
                    width="100%"
                  />
                </div>

                {/* Actions */}
                <div className="tw-flex tw-gap-4 tw-pt-4 tw-border-t tw-border-gray-200">
                  <Button
                    text="Create Task"
                    type="default"
                    stylingMode="contained"
                    icon="fa-light fa-check-circle"
                    onClick={handleSubmit}
                    disabled={loading || !formData.title?.trim() || !formData.description?.trim()}
                    elementAttr={{
                      class: "tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700"
                    }}
                  />
                  <Button
                    text="Save as Draft"
                    type="default"
                    stylingMode="outlined"
                    icon="fa-light fa-save"
                    onClick={() => notify('Draft feature coming soon', 'info', 2000)}
                    disabled={loading}
                  />
                  <Button
                    text="Cancel"
                    type="default"
                    stylingMode="text"
                    icon="fa-light fa-times"
                    onClick={() => onNavigate && onNavigate('my-tasks')}
                    disabled={loading}
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="tw-space-y-6">
            {/* Suggested Assignees */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
                Suggested Assignees
              </h3>
              <p className="tw-text-sm tw-text-gray-600 tw-mb-4">Based on workload and skills</p>

              <div className="tw-space-y-3">
                {sampleUsers.map((assignee) => (
                  <div key={assignee.id} className="tw-p-3 tw-border tw-rounded-lg">
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                      <span className="tw-font-medium">{assignee.name}</span>
                      <span className={`tw-text-sm ${getWorkloadColor(assignee.workload)}`}>
                        {assignee.workload} tasks
                      </span>
                    </div>
                    <div className="tw-flex tw-flex-wrap tw-gap-1">
                      {assignee.skills.map((skill) => (
                        <span key={skill} className="tw-px-2 tw-py-1 tw-bg-gray-100 tw-text-gray-700 tw-text-xs tw-rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Templates */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
                Quick Templates
              </h3>
              <p className="tw-text-sm tw-text-gray-600 tw-mb-4">Common task templates</p>

              <div className="tw-space-y-2">
                <Button
                  text="Tank Inspection"
                  stylingMode="outlined"
                  icon="fa-light fa-clipboard-check"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      title: 'Tank Inspection - ',
                      description: 'Perform routine inspection of tank levels, gauges, and visual condition check.',
                      type: 'Inspection',
                      priority: 'Medium'
                    }));
                  }}
                  width="100%"
                  elementAttr={{ class: "tw-justify-start tw-text-left" }}
                />
                <Button
                  text="Discrepancy Investigation"
                  stylingMode="outlined"
                  icon="fa-light fa-search"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      title: 'Investigate Discrepancy - ',
                      description: 'Investigate stock discrepancy and identify potential causes.',
                      type: 'Discrepancy',
                      priority: 'High'
                    }));
                  }}
                  width="100%"
                  elementAttr={{ class: "tw-justify-start tw-text-left" }}
                />
                <Button
                  text="Routine Maintenance"
                  stylingMode="outlined"
                  icon="fa-light fa-wrench"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      title: 'Routine Maintenance - ',
                      description: 'Perform scheduled maintenance on equipment.',
                      type: 'Maintenance',
                      priority: 'Medium'
                    }));
                  }}
                  width="100%"
                  elementAttr={{ class: "tw-justify-start tw-text-left" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCreationForm;
