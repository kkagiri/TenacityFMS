import React, { useState, useEffect } from "react";
import { DataGrid } from "devextreme-react";
import {
  Column,
  Paging,
  SearchPanel,
  HeaderFilter,
} from "devextreme-react/data-grid";
import axiosInstance from "../../../api/axiosInstance";
import notify from "devextreme/ui/notify";

/**
 * Provider Dashboard
 * Real-time health monitoring and statistics for all GPS tracking providers
 * Phase 7: Admin UI
 */
const ProviderDashboard = () => {
  const [providers, setProviders] = useState([]);
  const [healthData, setHealthData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 30 seconds if enabled
    const interval = autoRefresh
      ? setInterval(() => {
          loadDashboardData(true);
        }, 30000)
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // Load providers, health, and statistics in parallel
      const [providersRes, healthRes, statsRes] = await Promise.all([
        axiosInstance.get("/api/v1/providers/list"),
        axiosInstance.get("/api/v1/providers/health"),
        axiosInstance.get("/api/v1/providers/statistics"),
      ]);

      if (providersRes.data.Success) {
        setProviders(providersRes.data.Data);
      }

      if (healthRes.data.Success) {
        setHealthData(healthRes.data.Data);
      }

      if (statsRes.data.Success) {
        setStatistics(statsRes.data.Data);
      }

      if (!silent) {
        notify("Dashboard data refreshed", "success", 2000);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      notify("Failed to load dashboard data", "error", 3000);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleTestConnection = async (providerName) => {
    try {
      const response = await axiosInstance.post(
        `/api/v1/providers/${providerName}/test`
      );

      if (response.data.Success && response.data.Data.IsConnected) {
        notify(`Successfully connected to ${providerName}`, "success", 3000);
      } else {
        notify(`Failed to connect to ${providerName}`, "error", 3000);
      }
    } catch (error) {
      notify(`Error testing ${providerName}: ${error.message}`, "error", 3000);
    }
  };

  const handleReloadProviders = async () => {
    try {
      const response = await axiosInstance.post("/api/v1/providers/reload");

      if (response.data.Success) {
        notify("Providers reloaded successfully", "success", 3000);
        loadDashboardData();
      }
    } catch (error) {
      notify("Failed to reload providers", "error", 3000);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Healthy: "tw-bg-green-100 tw-text-green-800",
      Degraded: "tw-bg-yellow-100 tw-text-yellow-800",
      Unhealthy: "tw-bg-red-100 tw-text-red-800",
    };

    return (
      <span
        className={`tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${
          badges[status] || badges.Unhealthy
        }`}
      >
        <i
          className={`fa-light ${
            status === "Healthy"
              ? "fa-circle-check"
              : status === "Degraded"
              ? "fa-triangle-exclamation"
              : "fa-circle-xmark"
          } tw-mr-1`}
        ></i>
        {status}
      </span>
    );
  };

  const renderProviderStatus = (data) => {
    const health = healthData.find((h) => h.ProviderName === data.ProviderName);
    return health ? (
      getStatusBadge(health.Status)
    ) : (
      <span className="tw-text-gray-400">Unknown</span>
    );
  };

  const renderEnabledStatus = (data) => {
    return data.IsEnabled ? (
      <span className="tw-text-green-600">
        <i className="fa-light fa-check-circle tw-mr-1"></i>Enabled
      </span>
    ) : (
      <span className="tw-text-gray-400">
        <i className="fa-light fa-circle-xmark tw-mr-1"></i>Disabled
      </span>
    );
  };

  const renderDefaultStatus = (data) => {
    return data.IsDefault ? (
      <span className="tw-text-blue-600">
        <i className="fa-light fa-star tw-mr-1"></i>Default
      </span>
    ) : (
      <span className="tw-text-gray-400">-</span>
    );
  };

  const renderResponseTime = (data) => {
    const health = healthData.find((h) => h.ProviderName === data.ProviderName);
    if (!health) return <span className="tw-text-gray-400">-</span>;

    const time = health.ResponseTimeMs;
    const color =
      time < 100
        ? "tw-text-green-600"
        : time < 500
        ? "tw-text-yellow-600"
        : "tw-text-red-600";

    return <span className={color}>{time}ms</span>;
  };

  const renderActions = (data) => {
    return (
      <div className="tw-flex tw-gap-2">
        <button
          onClick={() => handleTestConnection(data.ProviderName)}
          className="tw-text-blue-600 hover:tw-text-blue-800 tw-text-sm"
          title="Test Connection"
        >
          <i className="fa-light fa-plug"></i>
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
        <div className="tw-text-center">
          <i className="fa-light fa-spinner-third fa-spin tw-text-4xl tw-text-blue-600"></i>
          <p className="tw-mt-4 tw-text-gray-600">
            Loading provider dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-p-6 tw-space-y-6">
      {/* Statistics Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-600">
                Total Providers
              </p>
              <p className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mt-2">
                {providers.length}
              </p>
            </div>
            <div className="tw-bg-blue-100 tw-rounded-full tw-p-3">
              <i className="fa-light fa-network-wired tw-text-2xl tw-text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-600">
                Healthy Providers
              </p>
              <p className="tw-text-3xl tw-font-bold tw-text-green-600 tw-mt-2">
                {healthData.filter((h) => h.IsHealthy).length}
              </p>
            </div>
            <div className="tw-bg-green-100 tw-rounded-full tw-p-3">
              <i className="fa-light fa-circle-check tw-text-2xl tw-text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-600">
                Total Requests
              </p>
              <p className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mt-2">
                {statistics?.TotalRequests?.toLocaleString() || 0}
              </p>
            </div>
            <div className="tw-bg-purple-100 tw-rounded-full tw-p-3">
              <i className="fa-light fa-chart-line tw-text-2xl tw-text-purple-600"></i>
            </div>
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-600">
                Success Rate
              </p>
              <p className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mt-2">
                {statistics?.TotalRequests > 0
                  ? (
                      (statistics.SuccessfulRequests /
                        statistics.TotalRequests) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="tw-bg-emerald-100 tw-rounded-full tw-p-3">
              <i className="fa-light fa-badge-check tw-text-2xl tw-text-emerald-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Provider List */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
              <i className="fa-light fa-list tw-mr-2"></i>
              Provider Status
            </h2>
            <div className="tw-flex tw-gap-3">
              <label className="tw-flex tw-items-center tw-text-sm tw-text-gray-700">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="tw-mr-2"
                />
                Auto-refresh (30s)
              </label>
              <button
                onClick={() => loadDashboardData()}
                className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-700 tw-text-sm"
              >
                <i className="fa-light fa-refresh tw-mr-2"></i>
                Refresh
              </button>
              <button
                onClick={handleReloadProviders}
                className="tw-px-4 tw-py-2 tw-bg-gray-600 tw-text-white tw-rounded-md hover:tw-bg-gray-700 tw-text-sm"
              >
                <i className="fa-light fa-arrows-rotate tw-mr-2"></i>
                Reload Providers
              </button>
            </div>
          </div>
        </div>

        <div className="tw-p-6">
          <DataGrid
            dataSource={providers}
            keyExpr="ProviderId"
            showBorders={true}
            rowAlternationEnabled={true}
            hoverStateEnabled={true}
          >
            <SearchPanel visible={true} />
            <HeaderFilter visible={true} />
            <Paging defaultPageSize={10} />

            <Column
              dataField="ProviderName"
              caption="Provider Name"
              width={200}
            />

            <Column
              dataField="DisplayName"
              caption="Display Name"
              width={200}
            />

            <Column
              caption="Status"
              width={120}
              cellRender={renderProviderStatus}
              alignment="center"
            />

            <Column
              caption="Enabled"
              width={100}
              cellRender={renderEnabledStatus}
              alignment="center"
            />

            <Column
              caption="Default"
              width={100}
              cellRender={renderDefaultStatus}
              alignment="center"
            />

            <Column
              caption="Response Time"
              width={130}
              cellRender={renderResponseTime}
              alignment="center"
            />

            <Column
              dataField="PriorityOrder"
              caption="Priority"
              width={80}
              alignment="center"
            />

            <Column
              caption="Actions"
              width={100}
              cellRender={renderActions}
              alignment="center"
            />
          </DataGrid>
        </div>
      </div>

      {/* Provider Statistics */}
      {statistics &&
        statistics.ProviderStats &&
        statistics.ProviderStats.length > 0 && (
          <div className="tw-bg-white tw-rounded-lg tw-shadow">
            <div className="tw-p-6 tw-border-b tw-border-gray-200">
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                <i className="fa-light fa-chart-bar tw-mr-2"></i>
                Provider Statistics
              </h2>
            </div>
            <div className="tw-p-6">
              <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
                {statistics.ProviderStats.map((stat) => (
                  <div
                    key={stat.ProviderName}
                    className="tw-border tw-border-gray-200 tw-rounded-lg tw-p-4"
                  >
                    <h3 className="tw-font-semibold tw-text-gray-900 tw-mb-3">
                      {stat.ProviderName}
                    </h3>
                    <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
                      <div>
                        <p className="tw-text-gray-600">Requests</p>
                        <p className="tw-font-semibold tw-text-lg">
                          {stat.RequestCount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="tw-text-gray-600">Success Rate</p>
                        <p className="tw-font-semibold tw-text-lg tw-text-green-600">
                          {stat.SuccessRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="tw-text-gray-600">Avg Response</p>
                        <p className="tw-font-semibold tw-text-lg">
                          {stat.AverageResponseTimeMs.toFixed(0)}ms
                        </p>
                      </div>
                      <div>
                        <p className="tw-text-gray-600">Status</p>
                        <p className="tw-font-semibold tw-text-lg">
                          {stat.HealthStatus}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ProviderDashboard;
