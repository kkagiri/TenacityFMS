import React, { useState, useEffect, useCallback } from 'react';
import CategoryGroupedWidgetRenderer from './CategoryGroupedWidgetRenderer';
import './DashboardPage.css';

/**
 * Main Dashboard Page Component
 * Integrates with your existing FMS dashboard architecture
 */
const DashboardPage = () => {
  // State management
  const [widgets, setWidgets] = useState([]);
  const [widgetData, setWidgetData] = useState({});
  const [isLoading, setIsLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [layoutSettings, setLayoutSettings] = useState({});
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Load saved layout settings from localStorage
  useEffect(() => {
    const savedLayouts = localStorage.getItem('fms_dashboard_layouts');
    if (savedLayouts) {
      try {
        setLayoutSettings(JSON.parse(savedLayouts));
      } catch (e) {
        console.warn('Failed to parse saved layout settings');
      }
    }
  }, []);

  // Save layout settings to localStorage
  const saveLayoutSettings = useCallback((newSettings) => {
    setLayoutSettings(newSettings);
    localStorage.setItem('fms_dashboard_layouts', JSON.stringify(newSettings));
  }, []);

  // Fetch widget instances from API
  const fetchWidgetInstances = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/widgets/instances');
      const result = await response.json();

      if (result.success && result.data) {
        setWidgets(result.data);

        // Initialize loading states
        const loadingStates = {};
        result.data.forEach(widget => {
          loadingStates[widget.id] = true;
        });
        setIsLoading(loadingStates);

        // Clear previous errors
        setErrors({});

        // Fetch data for each widget will be handled by useEffect
        setLastRefresh(new Date());
      } else {
        console.error('Failed to fetch widgets:', result.message);
      }
    } catch (error) {
      console.error('Error fetching widget instances:', error);
    }
  }, []);

  // Fetch data for a specific widget
  const fetchWidgetData = useCallback(async (widgetInstanceId) => {
    try {
      // Set loading state
      setIsLoading(prev => ({ ...prev, [widgetInstanceId]: true }));
      setErrors(prev => ({ ...prev, [widgetInstanceId]: null }));

      // Find widget configuration
      const widget = widgets.find(w => w.id === widgetInstanceId);
      if (!widget) {
        setErrors(prev => ({ ...prev, [widgetInstanceId]: 'Widget not found' }));
        return;
      }

      // Parse widget configuration
      let config = {};
      try {
        config = JSON.parse(widget.configurationJson || '{}');
      } catch (e) {
        console.warn('Failed to parse widget configuration:', e);
      }

      // Build request payload
      const requestData = {
        widgetInstanceId: widgetInstanceId,
        metricType: widget.template?.dataSource || 'default',
        mode: config.mode || 'cumulative',
        datePreset: config.datePreset || 'yesterday',
        siteIds: config.settings?.siteIds || null,
        vehicleIds: config.settings?.vehicleIds || null,
        filters: config.filters || {}
      };

      // Make API request
      const response = await fetch(`/api/dashboard/widgets/${widgetInstanceId}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setWidgetData(prev => ({
          ...prev,
          [widgetInstanceId]: {
            ...result.data,
            lastUpdated: new Date().toISOString()
          }
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          [widgetInstanceId]: result.message || 'Failed to load widget data'
        }));
      }
    } catch (error) {
      console.error(`Error fetching data for widget ${widgetInstanceId}:`, error);
      setErrors(prev => ({
        ...prev,
        [widgetInstanceId]: error.message || 'Network error'
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, [widgetInstanceId]: false }));
    }
  }, [widgets]);

  // Handle widget refresh
  const handleRefreshWidget = useCallback(async (widgetInstanceId) => {
    await fetchWidgetData(widgetInstanceId);
  }, [fetchWidgetData]);

  // Handle widget configuration changes
  const handleConfigChange = useCallback((widget) => {
    // Navigate to configuration page or open modal
    console.log('Configure widget:', widget);

    // Example: Open configuration modal
    // setConfigModalWidget(widget);
    // setShowConfigModal(true);

    // Example: Navigate to configuration page
    // window.location.href = `/dashboard/widgets/${widget.id}/configure`;
  }, []);

  // Initial load and data fetching
  useEffect(() => {
    fetchWidgetInstances();
  }, [fetchWidgetInstances]);

  // Fetch data for widgets when widgets array changes
  useEffect(() => {
    if (widgets.length > 0) {
      widgets.forEach(widget => {
        fetchWidgetData(widget.id);
      });
    }
  }, [widgets, fetchWidgetData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isEditMode) {
        fetchWidgetInstances();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchWidgetInstances, isEditMode]);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>FMS Dashboard</h1>
            <p>Real-time fleet management insights</p>
          </div>

          <div className="header-actions">
            <div className="last-refresh">
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>

            <button
              className="btn btn-outline"
              onClick={fetchWidgetInstances}
              disabled={Object.values(isLoading).some(loading => loading)}
              title="Refresh all widgets"
            >
              <i className={`fa-solid fa-refresh ${Object.values(isLoading).some(loading => loading) ? 'fa-spin' : ''}`} />
              Refresh All
            </button>

            <button
              className={`btn ${isEditMode ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <i className={`fa-solid ${isEditMode ? 'fa-check' : 'fa-edit'}`} />
              {isEditMode ? 'Done' : 'Edit Layout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {widgets.length === 0 ? (
          <div className="dashboard-empty">
            <div className="empty-state">
              <i className="fa-solid fa-chart-line" />
              <h2>No Widgets Found</h2>
              <p>Configure your dashboard widgets to start monitoring your fleet.</p>
              <button className="btn btn-primary">
                <i className="fa-solid fa-plus" />
                Add Your First Widget
              </button>
            </div>
          </div>
        ) : (
          <CategoryGroupedWidgetRenderer
            widgets={widgets}
            widgetData={widgetData}
            isLoading={isLoading}
            errors={errors}
            onRefresh={handleRefreshWidget}
            onConfigChange={handleConfigChange}
            isEditMode={isEditMode}
            layoutSettings={layoutSettings}
            onLayoutSettingsChange={saveLayoutSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-stats">
            <span>{widgets.length} widgets across {new Set(widgets.map(w => w.template?.category)).size} categories</span>
          </div>
          <div className="footer-info">
            <span>FMS Dashboard v2.0 • Enhanced Widget System</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
