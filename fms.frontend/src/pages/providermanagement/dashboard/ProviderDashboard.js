import React, { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import notify from "devextreme/ui/notify";
import ProviderDataGrid from "./ProviderDataGrid";
import { Button } from "devextreme-react/button";

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
        axiosInstance.get("/providers/list"),
        axiosInstance.get("/providers/health"),
        axiosInstance.get("/providers/statistics"),
      ]);

      // Handle lowercase 'success' from API
      if (providersRes.data.success || providersRes.data.Success) {
        // Normalize provider data to ensure consistent property names
        const providerData = providersRes.data.data || providersRes.data.Data || [];
        const normalizedProviders = providerData.map(p => ({
          providerId: p.providerId || p.ProviderId,
          providerName: p.providerName || p.ProviderName,
          displayName: p.displayName || p.DisplayName,
          description: p.description || p.Description,
          isEnabled: p.isEnabled ?? p.IsEnabled,
          isDefault: p.isDefault ?? p.IsDefault,
          priorityOrder: p.priorityOrder || p.PriorityOrder,
          configurationData: p.configurationData || p.ConfigurationData,
          createdAt: p.createdAt || p.CreatedAt,
          updatedAt: p.updatedAt || p.UpdatedAt
        }));
        setProviders(normalizedProviders);
      }

      if (healthRes.data.success || healthRes.data.Success) {
        setHealthData(healthRes.data.data || healthRes.data.Data || []);
      }

      if (statsRes.data.success || statsRes.data.Success) {
        setStatistics(statsRes.data.data || statsRes.data.Data || null);
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
        `/providers/${providerName}/test`
      );

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data;

      if (success && data.isConnected) {
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
      const response = await axiosInstance.post("/providers/reload");

      if (response.data.success || response.data.Success) {
        notify("Providers reloaded successfully", "success", 3000);
        loadDashboardData();
      }
    } catch (error) {
      notify("Failed to reload providers", "error", 3000);
    }
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
        <div className="tw-text-center">
          <p className="tw-text-2xl tw-font-semibold tw-text-blue-700">Loading…</p>
          <p className="tw-mt-2 tw-text-gray-600">Loading provider dashboard…</p>
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
            <div className="tw-bg-blue-100 tw-rounded-full tw-p-3 tw-text-blue-700 tw-font-semibold">TP</div>
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-600">
                Healthy Providers
              </p>
              <p className="tw-text-3xl tw-font-bold tw-text-green-600 tw-mt-2">
                {healthData.filter((h) => h.isHealthy ?? h.IsHealthy).length}
              </p>
            </div>
            <div className="tw-bg-green-100 tw-rounded-full tw-p-3 tw-text-green-700 tw-font-semibold">HP</div>
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-600">
                Total Requests
              </p>
              <p className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mt-2">
                {(statistics?.totalRequests ?? statistics?.TotalRequests ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="tw-bg-purple-100 tw-rounded-full tw-p-3 tw-text-purple-700 tw-font-semibold">TR</div>
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-600">
                Success Rate
              </p>
              <p className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mt-2">
                {(statistics?.totalRequests ?? statistics?.TotalRequests ?? 0) > 0
                  ? (
                      ((statistics?.successfulRequests ?? statistics?.SuccessfulRequests ?? 0) /
                        (statistics?.totalRequests ?? statistics?.TotalRequests ?? 1)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="tw-bg-emerald-100 tw-rounded-full tw-p-3 tw-text-emerald-700 tw-font-semibold">SR</div>
          </div>
        </div>
      </div>

      {/* Provider List */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Provider Status</h2>
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
              <Button stylingMode="text" text="Refresh" onClick={() => loadDashboardData()} />
              <Button stylingMode="text" text="Reload Providers" onClick={handleReloadProviders} />
            </div>
          </div>
        </div>

        <div className="tw-p-6">
          <ProviderDataGrid
            providers={providers}
            healthData={healthData}
            onTestConnection={handleTestConnection}
          />
        </div>
      </div>

      {/* Provider Statistics */}
      {statistics &&
        (statistics.providerStats || statistics.ProviderStats) &&
        (statistics.providerStats || statistics.ProviderStats).length > 0 && (
          <div className="tw-bg-white tw-rounded-lg tw-shadow">
            <div className="tw-p-6 tw-border-b tw-border-gray-200">
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Provider Statistics</h2>
            </div>
            <div className="tw-p-6">
              <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
                {(statistics.providerStats || statistics.ProviderStats).map((stat) => (
                  <div
                    key={stat.providerName || stat.ProviderName}
                    className="tw-border tw-border-gray-200 tw-rounded-lg tw-p-4"
                  >
                    <h3 className="tw-font-semibold tw-text-gray-900 tw-mb-3">
                      {stat.providerName || stat.ProviderName}
                    </h3>
                    <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
                      <div>
                        <p className="tw-text-gray-600">Requests</p>
                        <p className="tw-font-semibold tw-text-lg">
                          {(stat.requestCount || stat.RequestCount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="tw-text-gray-600">Success Rate</p>
                        <p className="tw-font-semibold tw-text-lg tw-text-green-600">
                          {(stat.successRate || stat.SuccessRate || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="tw-text-gray-600">Avg Response</p>
                        <p className="tw-font-semibold tw-text-lg">
                          {(stat.averageResponseTimeMs || stat.AverageResponseTimeMs || 0).toFixed(0)}ms
                        </p>
                      </div>
                      <div>
                        <p className="tw-text-gray-600">Status</p>
                        <p className="tw-font-semibold tw-text-lg">
                          {stat.healthStatus || stat.HealthStatus}
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
