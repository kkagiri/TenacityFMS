import React, { useState, useEffect } from 'react';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { Toast } from 'devextreme-react/toast';
import SampleDataService from '../../../services/sampleDataService';
import TaskService from '../../../services/taskService';

const SampleDataDemo = ({ onDataChanged }) => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [generationStatus, setGenerationStatus] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(TaskService.getDemoModeStatus());
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };

  const handleToggleDemoMode = () => {
    if (isDemoMode) {
      TaskService.disableDemoMode();
      setIsDemoMode(false);
      showToast('Demo mode disabled. Task Management will now use live data.', 'warning');
    } else {
      TaskService.enableDemoMode();
      setIsDemoMode(true);
      showToast('Demo mode enabled. Task Management will now use mock data.', 'success');
    }

    // Notify parent that demo mode has changed
    if (onDataChanged) {
      onDataChanged();
    }
  };

  const handleGenerateSampleData = async () => {
    setLoading(true);
    setGenerationStatus(null);

    // Enable demo mode for this operation
    const wasDemoMode = isDemoMode;
    if (!wasDemoMode) {
      TaskService.enableDemoMode();
      setIsDemoMode(true);
    }

    try {
      const result = await SampleDataService.generateFullSampleData();
      setGenerationStatus(result);
      showToast(
        `Successfully generated sample data! Created ${result.created.created.length} tasks, assigned ${result.assigned.assigned.length}, and completed ${result.completed.completed.length}.`,
        'success'
      );

      // Notify parent that data has changed
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error) {
      showToast('Failed to generate sample data: ' + error.message, 'error');
      console.error('Error generating sample data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSampleData = async () => {
    setLoading(true);

    try {
      const result = await SampleDataService.clearSampleData();
      setGenerationStatus(null);
      showToast(
        `Successfully cleared ${result.deleted.length} sample tasks.`,
        'success'
      );

      // Notify parent that data has changed
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error) {
      showToast('Failed to clear sample data: ' + error.message, 'error');
      console.error('Error clearing sample data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasksOnly = async () => {
    setLoading(true);

    try {
      const result = await SampleDataService.createSampleTasks();
      showToast(
        `Successfully created ${result.created.length} sample tasks.`,
        'success'
      );
    } catch (error) {
      showToast('Failed to create sample tasks: ' + error.message, 'error');
      console.error('Error creating sample tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTasksOnly = async () => {
    setLoading(true);

    try {
      const result = await SampleDataService.assignRandomTasks();
      showToast(
        `Successfully assigned ${result.assigned.length} tasks.`,
        'success'
      );
    } catch (error) {
      showToast('Failed to assign tasks: ' + error.message, 'error');
      console.error('Error assigning tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTasksOnly = async () => {
    setLoading(true);

    try {
      const result = await SampleDataService.completeSampleTasks();
      showToast(
        `Successfully completed ${result.completed.length} tasks.`,
        'success'
      );
    } catch (error) {
      showToast('Failed to complete tasks: ' + error.message, 'error');
      console.error('Error completing tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tw-p-6 tw-bg-gray-50 tw-min-h-screen">
      <div className="tw-max-w-4xl tw-mx-auto">
        <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-6">
          <i className="fa-light fa-flask tw-mr-2"></i>
          Task Management Demo - Sample Data
        </h1>

        {/* Info Panel */}
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-6 tw-mb-6">
          <div className="tw-flex tw-items-start">
            <i className="fa-light fa-info-circle tw-text-blue-600 tw-text-xl tw-mr-3 tw-mt-1"></i>
            <div>
              <h3 className="tw-text-lg tw-font-semibold tw-text-blue-800 tw-mb-2">
                Welcome to the Task Management Demo
              </h3>
              <p className="tw-text-blue-700 tw-mb-4">
                This demo allows you to generate realistic sample data to explore the Task Management system.
                You can create various types of tasks, assign them to users, and simulate completions to see
                how the system works in a real-world scenario.
              </p>
              <div className="tw-text-sm tw-text-blue-600">
                <p><strong>Sample Data Includes:</strong></p>
                <ul className="tw-list-disc tw-list-inside tw-mt-2 tw-space-y-1">
                  <li>10 different types of tasks (Inspection, Maintenance, Discrepancy, etc.)</li>
                  <li>Various priority levels (Critical, High, Medium, Low)</li>
                  <li>Different sites and tanks</li>
                  <li>Some overdue tasks for testing</li>
                  <li>Random task assignments and completions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Mode Toggle */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-mb-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-1">
                <i className="fa-light fa-toggle-on tw-mr-2"></i>
                Demo Mode
              </h3>
              <p className="tw-text-gray-600 tw-text-sm">
                {isDemoMode
                  ? 'Task Management is using mock data. All operations are simulated.'
                  : 'Task Management is using live data. Operations will affect the real database.'}
              </p>
            </div>
            <div className="tw-flex tw-items-center tw-space-x-3">
              <span className={`tw-text-sm tw-font-medium ${isDemoMode ? 'tw-text-green-600' : 'tw-text-gray-500'}`}>
                {isDemoMode ? 'DEMO MODE' : 'LIVE MODE'}
              </span>
              <Button
                text={isDemoMode ? 'Disable Demo Mode' : 'Enable Demo Mode'}
                type={isDemoMode ? 'default' : 'normal'}
                stylingMode={isDemoMode ? 'outlined' : 'contained'}
                onClick={handleToggleDemoMode}
                disabled={loading}
                elementAttr={{
                  class: isDemoMode
                    ? "tw-border-orange-600 tw-text-orange-600 hover:tw-bg-orange-50"
                    : "tw-bg-green-600 tw-text-white hover:tw-bg-green-700"
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-mb-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Quick Actions</h3>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-6">
            <Button
              text="🚀 Generate Complete Sample Data"
              type="default"
              stylingMode="contained"
              onClick={handleGenerateSampleData}
              disabled={loading}
              width="100%"
              elementAttr={{
                class: "tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700"
              }}
            />

            <Button
              text="🧹 Clear All Sample Data"
              type="default"
              stylingMode="outlined"
              onClick={handleClearSampleData}
              disabled={loading}
              width="100%"
              elementAttr={{
                class: "tw-border-red-600 tw-text-red-600 hover:tw-bg-red-50"
              }}
            />
          </div>

          <div className="tw-border-t tw-pt-4">
            <h4 className="tw-text-md tw-font-medium tw-text-gray-700 tw-mb-3">Step-by-Step Generation</h4>
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3">
              <Button
                text="1. Create Tasks"
                type="default"
                stylingMode="outlined"
                onClick={handleCreateTasksOnly}
                disabled={loading}
                width="100%"
              />

              <Button
                text="2. Assign Tasks"
                type="default"
                stylingMode="outlined"
                onClick={handleAssignTasksOnly}
                disabled={loading}
                width="100%"
              />

              <Button
                text="3. Complete Tasks"
                type="default"
                stylingMode="outlined"
                onClick={handleCompleteTasksOnly}
                disabled={loading}
                width="100%"
              />
            </div>
          </div>
        </div>

        {/* Generation Status */}
        {generationStatus && (
          <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-mb-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-chart-bar tw-mr-2"></i>
              Generation Results
            </h3>

            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
              <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-4">
                <div className="tw-flex tw-items-center">
                  <i className="fa-light fa-plus-circle tw-text-green-600 tw-text-xl tw-mr-3"></i>
                  <div>
                    <p className="tw-text-2xl tw-font-bold tw-text-green-800">
                      {generationStatus.created.created.length}
                    </p>
                    <p className="tw-text-green-600">Tasks Created</p>
                  </div>
                </div>
              </div>

              <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
                <div className="tw-flex tw-items-center">
                  <i className="fa-light fa-user-plus tw-text-blue-600 tw-text-xl tw-mr-3"></i>
                  <div>
                    <p className="tw-text-2xl tw-font-bold tw-text-blue-800">
                      {generationStatus.assigned.assigned.length}
                    </p>
                    <p className="tw-text-blue-600">Tasks Assigned</p>
                  </div>
                </div>
              </div>

              <div className="tw-bg-purple-50 tw-border tw-border-purple-200 tw-rounded-lg tw-p-4">
                <div className="tw-flex tw-items-center">
                  <i className="fa-light fa-check-circle tw-text-purple-600 tw-text-xl tw-mr-3"></i>
                  <div>
                    <p className="tw-text-2xl tw-font-bold tw-text-purple-800">
                      {generationStatus.completed.completed.length}
                    </p>
                    <p className="tw-text-purple-600">Tasks Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
            <i className="fa-light fa-lightbulb tw-mr-2"></i>
            Next Steps
          </h3>

          <div className="tw-space-y-4">
            <div className="tw-flex tw-items-start">
              <span className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-bg-blue-100 tw-text-blue-600 tw-rounded-full tw-text-sm tw-font-bold tw-mr-3 tw-mt-0.5">
                1
              </span>
              <div>
                <p className="tw-font-medium tw-text-gray-800">Generate Sample Data</p>
                <p className="tw-text-gray-600 tw-text-sm">
                  Click "Generate Complete Sample Data" to create a full set of realistic tasks
                </p>
              </div>
            </div>

            <div className="tw-flex tw-items-start">
              <span className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-bg-blue-100 tw-text-blue-600 tw-rounded-full tw-text-sm tw-font-bold tw-mr-3 tw-mt-0.5">
                2
              </span>
              <div>
                <p className="tw-font-medium tw-text-gray-800">Explore Task Lists</p>
                <p className="tw-text-gray-600 tw-text-sm">
                  Navigate to "My Tasks" and "All Tasks" tabs to see the generated data
                </p>
              </div>
            </div>

            <div className="tw-flex tw-items-start">
              <span className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-bg-blue-100 tw-text-blue-600 tw-rounded-full tw-text-sm tw-font-bold tw-mr-3 tw-mt-0.5">
                3
              </span>
              <div>
                <p className="tw-font-medium tw-text-gray-800">Test Task Operations</p>
                <p className="tw-text-gray-600 tw-text-sm">
                  Try creating, editing, assigning, and completing tasks to see the system in action
                </p>
              </div>
            </div>

            <div className="tw-flex tw-items-start">
              <span className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-bg-blue-100 tw-text-blue-600 tw-rounded-full tw-text-sm tw-font-bold tw-mr-3 tw-mt-0.5">
                4
              </span>
              <div>
                <p className="tw-font-medium tw-text-gray-800">View Analytics</p>
                <p className="tw-text-gray-600 tw-text-sm">
                  Check the Analytics tab to see charts and reports based on the sample data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LoadPanel
        visible={loading}
        message="Processing sample data..."
        showPane={true}
        shading={true}
        hideOnOutsideClick={false}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHiding={() => setToast({ ...toast, visible: false })}
        displayTime={5000}
        position="top center"
      />
    </div>
  );
};

export default SampleDataDemo;
