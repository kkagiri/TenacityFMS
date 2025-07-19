import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'devextreme-react';
import { useSelector } from 'react-redux';
import { useTankStockSignalR } from '../../../hooks/useTankStockSignalR';
import { useStockData } from '../shared/hooks/useStockData';
import { useDateRange } from '../../../hooks/useDateRange';
import MissionControlLayout from '../../../components/missionControl/layout/MissionControlLayout';
import TankLevelGauge from './components/TankLevelGauge';
import SiteOverviewCards from './components/SiteOverviewCards';
import EmergencyResponsePanel from './components/EmergencyResponsePanel';
import TankFilterPanel from './components/TankFilterPanel';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import './EnhancedTankStockDashboard.scss';

//Cursor - Enhanced Tank Stock Dashboard with Mission Control integration
const EnhancedTankStockDashboard = () => {
  const sites = useSelector((state) => state.site.sites);

  const [selectedSite, setSelectedSite] = useState(() => {
    const storedSite = localStorage.getItem('selectedSite');
    return storedSite && storedSite !== 'null' ? storedSite : 'all';
  });

  //Cursor - Use stable dateRange hook to prevent infinite re-renders (dashboard specific: today only)
  const { dateRange } = useDateRange(0); // 0 days = today only

  //Cursor - Use SignalR for real-time updates
  const { isConnected: signalRConnected } = useTankStockSignalR(
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

  // State for filtered tank data
  const [filteredTankLevels, setFilteredTankLevels] = useState([]);

  // Mission Control specific data
  const [missionControlData, setMissionControlData] = useState({
    criticalAlerts: [],
    liveMetrics: {},
    quickActions: []
  });

  // Handle filter changes from TankFilterPanel
  const handleFiltersChange = useCallback((filteredTanks) => {
    setFilteredTankLevels(filteredTanks);
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

  // Tank action handlers
  const handleViewTransactions = useCallback((tank) => {
    console.log('Viewing transactions for tank:', tank.name);
    // Implementation for viewing tank transactions
  }, []);

  const handleStockReconciliation = useCallback((tank) => {
    console.log('Starting stock reconciliation for tank:', tank.name);
    // Implementation for stock reconciliation
  }, []);

  const handleEditTank = useCallback((tank) => {
    console.log('Editing tank:', tank.name);
    // Implementation for editing tank
  }, []);

  const handleStockAdjustmentSubmit = useCallback(async (adjustmentData) => {
    console.log('Submitting stock adjustment:', adjustmentData);
    // Implementation for stock adjustment submission
    // This would call your stock adjustment API
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    } catch (error) {
      console.error('Stock adjustment failed:', error);
      throw error;
    }
  }, []);

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
      totalTanks: filteredTankLevels.length > 0 ? filteredTankLevels.length : tankLevels.length,
      stockLevel: Math.round(siteMetrics.averageStockLevel || 0),
      reconciliationAccuracy: 98.5, // This would come from reconciliation service
      activeAlerts: criticalAlerts.length,
      systemUptime: 99.8
    };

    const actions = [

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
  }, [criticalAlerts, tankLevels, filteredTankLevels, siteMetrics, handleEmergencyAction, handleEmergencyDelivery, handleForceReconciliation, handleCrossSiteTransfer, handleManualGaugeReading, handleScheduleMaintenance]);

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
      <Button
        text="Refresh"
        icon={`fa-light fa-refresh ${isLoading ? 'tw-animate-spin' : ''}`}
        onClick={refreshData}
        disabled={isLoading}
        type="default"
        stylingMode="contained"
        className="tw-ml-3"
      />
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

        {/* Tank Anomaly Filter Panel */}
        <TankFilterPanel
          tankData={tankLevels}
          onFiltersChange={handleFiltersChange}
        />

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
                  {filteredTankLevels.length > 0 ? filteredTankLevels.length : tankLevels.length} Tanks Shown
                </div>
              </div>
            </div>

            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-6">
              {(filteredTankLevels.length > 0 ? filteredTankLevels : tankLevels).length === 0 ? (
                <div className="tw-col-span-full tw-text-center tw-py-12 no-tanks-message">
                  <i className="fa-light fa-tank-water tw-text-4xl tw-text-gray-300 tw-mb-4"></i>
                  <p className="tw-text-gray-500 tw-text-lg tw-font-medium">No tanks match the current filters</p>
                  <p className="tw-text-gray-400 tw-text-sm tw-mt-2">Try adjusting your filter criteria or refresh the data</p>
                </div>
              ) : (
                (filteredTankLevels.length > 0 ? filteredTankLevels : tankLevels).map((tank) => (
                  <TankLevelGauge
                    key={tank.id}
                    tank={tank}
                    isConnected={signalRConnected}
                    enhanced={true}
                    showActions={true}
                    onViewTransactions={handleViewTransactions}
                    onStockReconciliation={handleStockReconciliation}
                    onEditTank={handleEditTank}
                    onStockAdjustmentSubmit={handleStockAdjustmentSubmit}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollView>
    </MissionControlLayout>
  );
};

export default EnhancedTankStockDashboard;