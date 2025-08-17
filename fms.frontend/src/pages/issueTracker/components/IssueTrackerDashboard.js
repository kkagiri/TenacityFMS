import React, { useState, useEffect } from 'react';
import { Button } from 'devextreme-react/button';
import { CheckBox } from 'devextreme-react/check-box';
import { NumberBox } from 'devextreme-react/number-box';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Popup } from 'devextreme-react/popup';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import QuickCreateIssuePopup from './QuickCreateIssuePopup';
import GPSTriggeredIssueForm from './GPSTriggeredIssueForm';
import gpsMonitoringService from '../../../services/gpsMonitoringService';
import issueTrackerService from '../../../services/issueTrackerService';

const IssueTrackerDashboard = () => {
  const [gpsMonitoring, setGpsMonitoring] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [signalLossThreshold, setSignalLossThreshold] = useState(30);
  const [speedThreshold, setSpeedThreshold] = useState(120);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsTriggeredForm, setGpsTriggeredForm] = useState(null);
  const [settingsPopup, setSettingsPopup] = useState(false);

  // Load initial data
  useEffect(() => {
    loadRecentIssues();
    updateMonitoringStatus();
  }, []);

  // Update monitoring status every 30 seconds
  useEffect(() => {
    const statusInterval = setInterval(() => {
      updateMonitoringStatus();
    }, 30000);

    return () => clearInterval(statusInterval);
  }, []);

  const loadRecentIssues = async () => {
    try {
      setLoading(true);
      const issues = await issueTrackerService.getIssues({
        limit: 10,
        sortBy: 'openDate',
        sortOrder: 'desc'
      });
      setRecentIssues(issues || []);
    } catch (error) {
      console.error('Error loading recent issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMonitoringStatus = () => {
    const status = gpsMonitoringService.getStatus();
    setMonitoringStatus(status);
    setGpsMonitoring(status.isMonitoring);
  };

  const handleGpsMonitoringToggle = (value) => {
    if (value) {
      // Update thresholds before starting
      gpsMonitoringService.updateThresholds({
        signalLossMinutes: signalLossThreshold,
        speedAnomalyThreshold: speedThreshold
      });

      gpsMonitoringService.startMonitoring(60); // Check every 60 seconds

      notify({
        message: 'GPS monitoring started successfully',
        type: 'success',
        displayTime: 3000
      });
    } else {
      gpsMonitoringService.stopMonitoring();

      notify({
        message: 'GPS monitoring stopped',
        type: 'info',
        displayTime: 3000
      });
    }

    setGpsMonitoring(value);
    updateMonitoringStatus();
  };

  const handleUpdateThresholds = () => {
    gpsMonitoringService.updateThresholds({
      signalLossMinutes: signalLossThreshold,
      speedAnomalyThreshold: speedThreshold
    });

    notify({
      message: 'Monitoring thresholds updated successfully',
      type: 'success',
      displayTime: 3000
    });

    setSettingsPopup(false);
  };

  const simulateGpsIssue = () => {
    // Simulate a GPS signal loss scenario
    const mockGpsData = {
      vehicleId: 1,
      vehicleName: 'Demo Truck 001',
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Demo Street, New York, NY',
      timestamp: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
      severity: 'High',
      isUrgent: true,
      suggestedTitle: 'GPS Signal Lost - Demo Truck 001',
      suggestedDescription: 'Demo: Vehicle has not reported GPS data for 35 minutes. This is a simulated issue for demonstration purposes.',
      anomalyType: 'signal_loss'
    };

    setGpsTriggeredForm(mockGpsData);
  };

  const handleGpsFormClose = () => {
    setGpsTriggeredForm(null);
  };

  const handleGpsFormSave = (savedIssue) => {
    setGpsTriggeredForm(null);
    loadRecentIssues(); // Refresh the issues list
  };

  const handleQuickIssueCreated = (newIssue) => {
    loadRecentIssues(); // Refresh the issues list
  };

  const renderPriorityCell = (cellData) => {
    const priority = cellData.value;
    let colorClass = '';

    switch (priority) {
      case 'Critical':
        colorClass = 'tw-text-red-600 tw-font-semibold';
        break;
      case 'High':
        colorClass = 'tw-text-orange-600 tw-font-semibold';
        break;
      case 'Medium':
        colorClass = 'tw-text-yellow-600 tw-font-medium';
        break;
      case 'Low':
        colorClass = 'tw-text-green-600';
        break;
      default:
        colorClass = 'tw-text-gray-600';
    }

    return (
      <span className={colorClass}>
        {priority || 'Not Set'}
      </span>
    );
  };

  const renderStatusCell = (cellData) => {
    const status = cellData.value;
    let colorClass = '';
    let bgClass = '';

    switch (status) {
      case 'Open':
        colorClass = 'tw-text-blue-700';
        bgClass = 'tw-bg-blue-100';
        break;
      case 'In Progress':
        colorClass = 'tw-text-yellow-700';
        bgClass = 'tw-bg-yellow-100';
        break;
      case 'Resolved':
        colorClass = 'tw-text-green-700';
        bgClass = 'tw-bg-green-100';
        break;
      case 'Closed':
        colorClass = 'tw-text-gray-700';
        bgClass = 'tw-bg-gray-100';
        break;
      default:
        colorClass = 'tw-text-gray-600';
        bgClass = 'tw-bg-gray-50';
    }

    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${colorClass} ${bgClass}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="tw-p-6 tw-bg-gray-50 tw-min-h-screen">
      {/* Header */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-mb-6">
        <div className="tw-flex tw-justify-between tw-items-start tw-mb-4">
          <div>
            <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mb-2">
              <i className="fa-light fa-dashboard tw-mr-3 tw-text-orange-500"></i>
              Issue Tracker Dashboard
            </h1>
            <p className="tw-text-gray-600">
              Comprehensive issue management with automated GPS monitoring and multiple creation workflows
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-6">
        {/* Quick Create Issue */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
            <i className="fa-light fa-plus-circle tw-mr-2 tw-text-green-500"></i>
            Quick Actions
          </h3>
          <div className="tw-space-y-3">
            <QuickCreateIssuePopup
              triggerButtonText="Quick Create"
              workflowType="quick-create"
              onIssueCreated={handleQuickIssueCreated}
            />
            <Button
              text="Simulate GPS Issue"
              icon="fa-light fa-satellite-dish"
              type="normal"
              stylingMode="outlined"
              onClick={simulateGpsIssue}
              width="100%"
            />
          </div>
        </div>

        {/* GPS Monitoring Status */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
            <i className="fa-light fa-satellite tw-mr-2 tw-text-blue-500"></i>
            GPS Monitoring
          </h3>
          <div className="tw-space-y-3">
            <CheckBox
              text="Enable GPS Monitoring"
              value={gpsMonitoring}
              onValueChanged={(e) => handleGpsMonitoringToggle(e.value)}
            />
            {monitoringStatus && (
              <div className="tw-text-sm tw-text-gray-600">
                <p>Vehicles: {monitoringStatus.vehicleCount}</p>
                <p>Status: {monitoringStatus.isMonitoring ? 'Active' : 'Inactive'}</p>
              </div>
            )}
            <Button
              text="Settings"
              icon="fa-light fa-cog"
              type="normal"
              stylingMode="text"
              onClick={() => setSettingsPopup(true)}
            />
          </div>
        </div>

        {/* Issue Statistics */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
            <i className="fa-light fa-chart-line tw-mr-2 tw-text-purple-500"></i>
            Statistics
          </h3>
          <div className="tw-space-y-2">
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-sm tw-text-gray-600">Total Issues:</span>
              <span className="tw-font-medium">{recentIssues.length}</span>
            </div>
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-sm tw-text-gray-600">Open:</span>
              <span className="tw-font-medium tw-text-blue-600">
                {recentIssues.filter(i => i.statusName === 'Open').length}
              </span>
            </div>
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-sm tw-text-gray-600">High Priority:</span>
              <span className="tw-font-medium tw-text-orange-600">
                {recentIssues.filter(i => i.priorityName === 'High' || i.priorityName === 'Critical').length}
              </span>
            </div>
          </div>
        </div>

        {/* Workflow Types */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
            <i className="fa-light fa-workflow tw-mr-2 tw-text-indigo-500"></i>
            Workflows
          </h3>
          <div className="tw-space-y-2 tw-text-sm">
            <div className="tw-flex tw-items-center">
              <i className="fa-light fa-lightning tw-mr-2 tw-text-yellow-500"></i>
              <span>Quick Create</span>
            </div>
            <div className="tw-flex tw-items-center">
              <i className="fa-light fa-satellite tw-mr-2 tw-text-blue-500"></i>
              <span>GPS Triggered</span>
            </div>
            <div className="tw-flex tw-items-center">
              <i className="fa-light fa-list tw-mr-2 tw-text-green-500"></i>
              <span>Standard Form</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Issues Table */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        <div className="tw-p-6 tw-border-b">
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900">
            <i className="fa-light fa-clock tw-mr-2 tw-text-gray-500"></i>
            Recent Issues
          </h2>
        </div>

        {loading ? (
          <div className="tw-flex tw-justify-center tw-items-center tw-py-12">
            <LoadIndicator visible={true} />
            <span className="tw-ml-3 tw-text-gray-600">Loading recent issues...</span>
          </div>
        ) : (
          <DataGrid
            dataSource={recentIssues}
            keyExpr="id"
            showBorders={false}
            columnAutoWidth={true}
            height={400}
          >
            <Column dataField="id" caption="ID" width={80} />
            <Column dataField="problemTitle" caption="Title" minWidth={200} />
            <Column
              dataField="priorityName"
              caption="Priority"
              width={100}
              cellRender={renderPriorityCell}
            />
            <Column
              dataField="statusName"
              caption="Status"
              width={120}
              cellRender={renderStatusCell}
            />
            <Column dataField="categoryName" caption="Category" width={120} />
            <Column dataField="vehicleHyoungNo" caption="Vehicle" width={120} />
            <Column
              dataField="openDate"
              caption="Created"
              width={120}
              dataType="date"
              format="dd/MM/yyyy HH:mm"
            />
          </DataGrid>
        )}
      </div>

      {/* GPS Monitoring Settings Popup */}
      <Popup
        visible={settingsPopup}
        onHiding={() => setSettingsPopup(false)}
        dragEnabled={false}
        hideOnOutsideClick={true}
        showTitle={true}
        title="GPS Monitoring Settings"
        width={500}
        height={400}
      >
        <div className="tw-p-6">
          <div className="tw-space-y-6">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Signal Loss Threshold (minutes)
              </label>
              <NumberBox
                value={signalLossThreshold}
                onValueChanged={(e) => setSignalLossThreshold(e.value)}
                min={5}
                max={120}
                showSpinButtons={true}
              />
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                Trigger alert when vehicle hasn't reported for this many minutes
              </p>
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Speed Threshold (km/h)
              </label>
              <NumberBox
                value={speedThreshold}
                onValueChanged={(e) => setSpeedThreshold(e.value)}
                min={50}
                max={200}
                showSpinButtons={true}
              />
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                Trigger alert when vehicle exceeds this speed
              </p>
            </div>

            <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-8">
              <Button
                text="Cancel"
                type="normal"
                stylingMode="outlined"
                onClick={() => setSettingsPopup(false)}
              />
              <Button
                text="Update Settings"
                type="default"
                stylingMode="contained"
                onClick={handleUpdateThresholds}
                className="tw-bg-orange-600 tw-text-white"
              />
            </div>
          </div>
        </div>
      </Popup>

      {/* GPS Triggered Issue Form */}
      {gpsTriggeredForm && (
        <GPSTriggeredIssueForm
          gpsData={gpsTriggeredForm}
          onClose={handleGpsFormClose}
          onSave={handleGpsFormSave}
        />
      )}
    </div>
  );
};

export default IssueTrackerDashboard;
