import React, { useState, useEffect } from 'react';
import {
  Button,
  DataGrid,
  LoadPanel,
  Popup,
  ScrollView,
  TextArea,
  Toolbar,
  Item as ToolbarItem
} from 'devextreme-react';
import { Column } from 'devextreme-react/data-grid';
import { confirm } from 'devextreme/ui/dialog';
import axiosInstance from '../../../api/axiosInstance';
import notify from 'devextreme/ui/notify';

const PTSServiceControl = () => {
  const [serviceStatus, setServiceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadServiceStatus();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadServiceStatus();
      }, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadServiceStatus = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/PTSService/status');
      if (response.data.isSuccess) {
        setServiceStatus(response.data.data);
        setLastRefresh(new Date());
      } else {
        notify({
          message: `Failed to load service status: ${response.data.message}`,
          type: 'error',
          displayTime: 4000
        });
      }
    } catch (error) {
      console.error('Error loading service status:', error);
      notify({
        message: 'Failed to load service status',
        type: 'error',
        displayTime: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const executeServiceAction = async (action, actionName) => {
    const confirmResult = await confirm(
      `Are you sure you want to ${actionName.toLowerCase()} the PTS Service?`,
      `${actionName} Service`
    );

    if (!confirmResult) return;

    setLoading(true);
    try {
      const response = await axiosInstance.post(`/PTSService/${action}`);
      if (response.data.isSuccess) {
        setServiceStatus(response.data.data);
        notify({
          message: `Service ${actionName.toLowerCase()} completed successfully`,
          type: 'success',
          displayTime: 3000
        });
      } else {
        notify({
          message: `Failed to ${actionName.toLowerCase()} service: ${response.data.message}`,
          type: 'error',
          displayTime: 4000
        });
      }
    } catch (error) {
      console.error(`Error ${actionName.toLowerCase()} service:`, error);
      notify({
        message: `Failed to ${actionName.toLowerCase()} service`,
        type: 'error',
        displayTime: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await axiosInstance.get('/PTSService/logs?lines=100');
      if (response.data.isSuccess) {
        setLogs(response.data.data);
        setLogsVisible(true);
      } else {
        notify({
          message: 'Failed to load service logs',
          type: 'error',
          displayTime: 3000
        });
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      notify({
        message: 'Failed to load service logs',
        type: 'error',
        displayTime: 3000
      });
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'tw-bg-green-100 tw-text-green-800 tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium';
      case 'stopped':
        return 'tw-bg-red-100 tw-text-red-800 tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium';
      case 'starting':
      case 'stopping':
        return 'tw-bg-yellow-100 tw-text-yellow-800 tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium';
      default:
        return 'tw-bg-gray-100 tw-text-gray-800 tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium';
    }
  };

  const formatMemoryUsage = (memoryMB) => {
    if (!memoryMB) return 'N/A';
    return `${memoryMB} MB`;
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const serviceData = serviceStatus ? [
    { key: 'Service Name', value: serviceStatus.displayName || serviceStatus.serviceName },
    { key: 'Status', value: serviceStatus.status, isStatus: true },
    { key: 'Start Type', value: serviceStatus.startType },
    { key: 'Process ID', value: serviceStatus.processId || 'N/A' },
    { key: 'Memory Usage', value: formatMemoryUsage(serviceStatus.memoryUsageMB) },
    { key: 'Last Check', value: formatDateTime(serviceStatus.lastStatusCheck) },
    { key: 'Log File', value: serviceStatus.logFilePath || 'Not specified' }
  ] : [];

  return (
    <div className="tw-p-6 tw-space-y-6">
      <LoadPanel visible={loading} />

      {/* Header */}
      <div className="tw-flex tw-justify-between tw-items-center">
        <div>
          <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">PTS Service Control</h1>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Monitor and control the PTS Windows Service
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-space-x-2">
          {lastRefresh && (
            <span className="tw-text-sm tw-text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Service Status Card */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Service Status</h2>
          <div className="tw-flex tw-space-x-2">
            <Button
              text="Auto Refresh"
              type={autoRefresh ? 'success' : 'normal'}
              icon="fa-light fa-sync"
              onClick={() => setAutoRefresh(!autoRefresh)}
            />
            <Button
              text="Refresh"
              type="normal"
              icon="fa-light fa-refresh"
              onClick={loadServiceStatus}
              disabled={loading}
            />
          </div>
        </div>

        {serviceStatus && (
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
            <div>
              <DataGrid
                dataSource={serviceData}
                showBorders={false}
                showColumnHeaders={false}
                showRowLines={true}
                rowAlternationEnabled={false}
                columnAutoWidth={true}
              >
                <Column
                  dataField="key"
                  caption="Property"
                  width="40%"
                  cellRender={({ data }) => (
                    <span className="tw-font-medium tw-text-gray-700">{data.key}</span>
                  )}
                />
                <Column
                  dataField="value"
                  caption="Value"
                  cellRender={({ data }) => (
                    data.isStatus ? (
                      <span className={getStatusBadgeClass(data.value)}>
                        <i className={`fa-light fa-circle ${data.value?.toLowerCase() === 'running' ? 'tw-text-green-600' : 'tw-text-red-600'} tw-mr-1`}></i>
                        {data.value}
                      </span>
                    ) : (
                      <span className="tw-text-gray-900">{data.value}</span>
                    )
                  )}
                />
              </DataGrid>
            </div>

            <div className="tw-space-y-3">
              <h3 className="tw-text-md tw-font-medium tw-text-gray-700">Actions</h3>
              <div className="tw-flex tw-flex-col tw-space-y-2">
                <Button
                  text="Start Service"
                  type="success"
                  icon="fa-light fa-play"
                  disabled={!serviceStatus.canStart || loading}
                  onClick={() => executeServiceAction('start', 'Start')}
                  width="100%"
                />
                <Button
                  text="Stop Service"
                  type="danger"
                  icon="fa-light fa-stop"
                  disabled={!serviceStatus.canStop || loading}
                  onClick={() => executeServiceAction('stop', 'Stop')}
                  width="100%"
                />
                <Button
                  text="Restart Service"
                  type="default"
                  icon="fa-light fa-refresh"
                  disabled={!serviceStatus.canRestart || loading}
                  onClick={() => executeServiceAction('restart', 'Restart')}
                  width="100%"
                />
                <Button
                  text="View Logs"
                  type="normal"
                  icon="fa-light fa-file-lines"
                  onClick={loadLogs}
                  width="100%"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {serviceStatus?.recentLogEntries?.length > 0 && (
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">Recent Activity</h3>
          <div className="tw-bg-gray-50 tw-rounded tw-p-3 tw-max-h-48 tw-overflow-y-auto">
            {serviceStatus.recentLogEntries.slice(-10).map((entry, index) => (
              <div key={index} className="tw-text-sm tw-font-mono tw-text-gray-700 tw-mb-1">
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Popup */}
      <Popup
        visible={logsVisible}
        onHiding={() => setLogsVisible(false)}
        title="Service Logs"
        showCloseButton={true}
        width="800px"
        height="600px"
        maxWidth="90vw"
        maxHeight="80vh"
      >
        <div className="tw-p-4">
          <ScrollView height="60vh">
            <div className="tw-text-green-400 tw-p-4 tw-rounded tw-font-mono tw-text-sm">
              {logs.map((line, index) => (
                <div key={index} className="tw-mb-1">
                  {line}
                </div>
              ))}
            </div>
          </ScrollView>
          <div className="tw-mt-4 tw-flex tw-justify-end">
            <Button
              text="Close"
              onClick={() => setLogsVisible(false)}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default PTSServiceControl;