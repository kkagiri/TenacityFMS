import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTankStockSignalR } from '../../../hooks/useTankStockSignalR';
import { useStockData } from '../shared/hooks/useStockData';
import MissionControlLayout from '../../../components/missionControl/layout/MissionControlLayout';
import TankLevelGauge from './components/TankLevelGauge';
import AlertsPanel from './components/AlertsPanel';
import SiteOverviewCards from './components/SiteOverviewCards';
import EmergencyResponsePanel from './components/EmergencyResponsePanel';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import './EnhancedTankStockDashboard.scss';

//Cursor - Enhanced Tank Stock Dashboard with Mission Control integration
const EnhancedTankStockDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);

  const [selectedSite, setSelectedSite] = useState(() => {
    const storedSite = localStorage.getItem('selectedSite');
    return storedSite && storedSite !== 'null' ? storedSite : 'all';
  });

  //Cursor - Memoize dateRange to prevent unnecessary re-renders
  const dateRange = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return [today, today];
  }, []); // Empty dependency array since it's always today

  //Cursor - Use SignalR for real-time updates
  const { isConnected: signalRConnected, requestTankDataRefresh } = useTankStockSignalR(
    selectedSite,
    dateRange,
    true
  );

  //Cursor - Use shared hook for data management
  const {
    isLoading,
    tankLevels,
    criticalAlerts,
    siteMetrics,
    refreshData
  } = useStockData(selectedSite, dateRange);

  // Mission Control specific data
  const [missionControlData, setMissionControlData] = useState({
    criticalAlerts: [],
    liveMetrics: {},
    quickActions: []
  });

  useEffect(() => {
    //Cursor - Transform data for Mission Control format
    const transformedAlerts = criticalAlerts.map(alert => ({
      id: alert.id || Math.random(),
      message: alert.message || alert.description,
      severity: alert.level === 'high' ? 'critical' : alert.level === 'medium' ? 'warning' : 'info',
      location: alert.tankName || alert.siteName,
      actionRequired: alert.requiresAction,
      onAction: () => handleEmergencyAction(alert)
    }));

    const metrics = {
      totalTanks: tankLevels.length,
      stockLevel: Math.round(siteMetrics.averageStockLevel || 0),
      reconciliationAccuracy: 98.5, // This would come from reconciliation service
      activeAlerts: criticalAlerts.length,
      systemUptime: 99.8
    };

    const actions = [
      {
        id: 'emergency_delivery',
        label: 'Emergency Delivery',
        icon: 'fa-truck-fast',
        criticality: 'HIGH',
        isPrimary: true,
        requiresConfirmation: true,
        estimatedTime: '45 min',
        onClick: () => handleEmergencyDelivery()
      },
      {
        id: 'force_reconciliation',
        label: 'Force Reconciliation',
        icon: 'fa-light fa-calculator',
        criticality: 'MEDIUM',
        isPrimary: true,
        estimatedTime: '5 min',
        onClick: () => handleForceReconciliation()
      },
      {
        id: 'cross_site_transfer',
        label: 'Inter-Site Transfer',
        icon: ' fa-light fa-arrows-spin',
        criticality: 'MEDIUM',
        isPrimary: true,
        estimatedTime: '2 hours',
        onClick: () => handleCrossSiteTransfer()
      },
      {
        id: 'manual_gauge',
        label: 'Manual Gauge Reading',
        icon: 'fa-light fa-gauge',
        criticality: 'LOW',
        isPrimary: false,
        estimatedTime: '10 min',
        onClick: () => handleManualGaugeReading()
      },
      {
        id: 'tank_maintenance',
        label: 'Schedule Maintenance',
        icon: 'fa-light fa-wrench',
        criticality: 'LOW',
        isPrimary: false,
        estimatedTime: '30 min',
        onClick: () => handleScheduleMaintenance()
      }
    ];

    setMissionControlData({
      criticalAlerts: transformedAlerts,
      liveMetrics: metrics,
      quickActions: actions
    });
  }, [criticalAlerts, tankLevels, siteMetrics]);

  const handleSiteChange = useCallback((e) => {
    const newSite = e.value || 'all';
    setSelectedSite(newSite);
    localStorage.setItem('selectedSite', newSite);
  }, []);

  const handleEmergencyAction = useCallback((alert) => {
    //Cursor - Handle emergency actions from alerts
    console.log('Emergency action for alert:', alert);
    // Implementation would depend on alert type
  }, []);

  const handleEmergencyDelivery = useCallback(async () => {
    //Cursor - Emergency delivery workflow
    console.log('Initiating emergency delivery...');
    // Implementation for emergency delivery
  }, []);

  const handleForceReconciliation = useCallback(async () => {
    //Cursor - Force reconciliation workflow
    console.log('Forcing reconciliation...');
    // Implementation for force reconciliation
  }, []);

  const handleCrossSiteTransfer = useCallback(async () => {
    //Cursor - Cross-site transfer workflow
    console.log('Initiating cross-site transfer...');
    // Implementation for cross-site transfer
  }, []);

  const handleManualGaugeReading = useCallback(async () => {
    //Cursor - Manual gauge reading workflow
    console.log('Starting manual gauge reading...');
    // Implementation for manual gauge reading
  }, []);

  const handleScheduleMaintenance = useCallback(async () => {
    //Cursor - Schedule maintenance workflow
    console.log('Scheduling maintenance...');
    // Implementation for maintenance scheduling
  }, []);

  const additionalHeaderContent = (
    <div className="tw-flex tw-items-center tw-space-x-4">
      <div className="tw-flex tw-items-center tw-space-x-3">
        <span className="tw-text-sm tw-text-gray-600">
          Site: {selectedSite === 'all' ? 'All Sites' : sites.find(s => s.id === selectedSite)?.name || 'Unknown'}
        </span>
        <div className={`tw-flex tw-items-center tw-px-3 tw-py-1 tw-rounded-full tw-text-sm ${
          signalRConnected
            ? 'tw-bg-green-100 tw-text-green-800'
            : 'tw-bg-red-100 tw-text-red-800'
        }`}>
          <i className={`fa-light ${signalRConnected ? 'fa-satellite-dish' : 'fa-exclamation-triangle'} tw-mr-1`}></i>
          {signalRConnected ? 'Live Updates' : 'Offline'}
        </div>
      </div>
      <button
        onClick={refreshData}
        disabled={isLoading}
        className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-transition-all tw-hover:bg-blue-700 tw-disabled:opacity-50"
      >
        <i className={`fa-light fa-refresh ${isLoading ? 'tw-animate-spin' : ''} tw-mr-2`}></i>
        Refresh
      </button>
    </div>
  );

  return (
    <MissionControlLayout
      title="Tank Operations Control"
      criticalAlerts={missionControlData.criticalAlerts}
      liveMetrics={missionControlData.liveMetrics}
      quickActions={missionControlData.quickActions}
      additionalHeaderContent={additionalHeaderContent}
      className="enhanced-tank-dashboard"
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-bottom-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-justify-center tw-items-center tw-z-40">
          <div className="tw-text-center tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg">
            <LoadIndicator width={'48px'} height={'48px'} visible={true} />
            <div className="tw-mt-4 tw-text-gray-600 tw-font-medium">
              Loading mission control...
            </div>
          </div>
        </div>
      )}

      <ScrollView className="enhanced-tank-dashboard-content">
        {/* Emergency Response Panel */}
        <div className="tw-mb-6">
          <EmergencyResponsePanel
            activeIncidents={missionControlData.criticalAlerts.filter(alert => alert.severity === 'critical')}
            selectedSite={selectedSite}
          />
        </div>

        {/* Site Overview Cards */}
        <div className="tw-mb-6">
          <SiteOverviewCards
            siteMetrics={siteMetrics}
            selectedSite={selectedSite}
            enhanced={true}
          />
        </div>

        {/* Real-time Tank Monitoring */}
        <div className="tw-mb-6">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
              <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
                <i className="fa-light fa-gauge tw-mr-2 tw-text-blue-600"></i>
                Mission Control Tank Monitoring
              </h2>
              <div className="tw-flex tw-items-center tw-space-x-4">
                <div className="tw-text-sm tw-text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
                <div className="tw-bg-blue-50 tw-text-blue-700 tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium">
                  {tankLevels.length} Tanks Active
                </div>
              </div>
            </div>

            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-6">
              {tankLevels.map((tank) => (
                <TankLevelGauge
                  key={tank.id}
                  tank={tank}
                  isConnected={signalRConnected}
                  enhanced={true}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollView>
    </MissionControlLayout>
  );
};

export default EnhancedTankStockDashboard;