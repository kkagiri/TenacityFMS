import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ScrollView } from 'devextreme-react';
import { Button } from 'devextreme-react/button';
import Tabs from 'devextreme-react/tabs';
import notify from 'devextreme/ui/notify';
import { usePermissions } from '../../../hooks/usePermissions';
import GeneralSettingsTab from './components/GeneralSettingsTab';
import ValidationSettingsTab from './components/ValidationSettingsTab';
import BulkImportSettingsTab from './components/BulkImportSettingsTab';
import {
  fetchSystemConfigurations,
  updateSystemConfiguration
} from '../../../redux/actions/systemConfigActions';

const TankStockSettings = () => {
  const dispatch = useDispatch();
  const { userInfo, hasPermission } = usePermissions();
  const { configurations, loading } = useSelector((state) => state.systemConfig);

  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));

  const [settings, setSettings] = useState({
    futureRecordsPolicy: 'WARN_RECALCULATE',
    showDetailedWarnings: true,
    maxHistoricalDays: 400,
    allowOverride: true,
    showRecordDetails: true,
    enableSensorPhysicalStockUpdate: false
  });

  const [stockValidationSettings, setStockValidationSettings] = useState({
    varianceThresholdPercentage: 5,
    varianceThresholdAbsoluteLiters: 50,
    enableRealtimeValidation: true,
    validationDebounceMs: 500,
    requireConfirmationOnHighVariance: true,
    transferReconciliationDefaultDaysRange: 30,
    transferReconciliationMaxPeriodsToAnalyze: 100,
    transferReconciliationIncludeTransferDetailsDefault: false
  });

  const [bulkImportSettings, setBulkImportSettings] = useState({
    defaultDuplicateHandling: 'Skip',
    allowWarningImport: true,
    maxBatchSize: 1000,
    enableAutoValidation: true,
    stockContinuityEnabled: true,
    stockContinuityThresholdLiters: 500,
    stockContinuityThresholdPercent: 10,
    balanceEquationEnabled: true,
    balanceEquationTolerancePercent: 2,
    balanceEquationMinVarianceLiters: 10,
    meterReadingsEnabled: true,
    meterReadingsTolerancePercent: 5,
    meterReadingsMinVarianceLiters: 20,
    meterReadingsAllowReset: true,
    transferReciprocityEnabled: true,
    transferReciprocityToleranceLiters: 10
  });

  const [saving, setSaving] = useState(false);
  const [configMap, setConfigMap] = useState({});

  // Check if user has settings permission
  const hasAdminPermission = hasPermission('_Update_TankStock');

  // Fetch Tank Stock configurations
  useEffect(() => {
    dispatch(fetchSystemConfigurations({ category: 'TankStock' }));
    dispatch(fetchSystemConfigurations({ category: 'Tank Management' }));
    dispatch(fetchSystemConfigurations({ category: 'BulkImport' }));
    dispatch(fetchSystemConfigurations({ category: 'Stock Management' }));
  }, [dispatch]);

  // Map configurations to settings
  useEffect(() => {
    if (configurations && configurations.length > 0) {
      const configMapping = {};
      const newSettings = {
        futureRecordsPolicy: 'WARN_RECALCULATE',
        showDetailedWarnings: true,
        maxHistoricalDays: 400,
        allowOverride: true,
        showRecordDetails: true,
        enableSensorPhysicalStockUpdate: false
      };

      const newBulkImportSettings = {
        defaultDuplicateHandling: 'Skip',
        allowWarningImport: true,
        maxBatchSize: 1000,
        enableAutoValidation: true,
        stockContinuityEnabled: true,
        stockContinuityThresholdLiters: 500,
        stockContinuityThresholdPercent: 10,
        balanceEquationEnabled: true,
        balanceEquationTolerancePercent: 2,
        balanceEquationMinVarianceLiters: 10,
        meterReadingsEnabled: true,
        meterReadingsTolerancePercent: 5,
        meterReadingsMinVarianceLiters: 20,
        meterReadingsAllowReset: true,
        transferReciprocityEnabled: true,
        transferReciprocityToleranceLiters: 10
      };

      const newStockValidationSettings = {
        varianceThresholdPercentage: 5,
        varianceThresholdAbsoluteLiters: 50,
        enableRealtimeValidation: true,
        validationDebounceMs: 500,
        requireConfirmationOnHighVariance: true,
        transferReconciliationDefaultDaysRange: 30,
        transferReconciliationMaxPeriodsToAnalyze: 100,
        transferReconciliationIncludeTransferDetailsDefault: false
      };

      configurations.forEach(config => {
        configMapping[config.configurationKey] = config;

        // Map TankStock configuration values
        switch (config.configurationKey) {
          case 'TankStock.FutureRecords.Policy':
            newSettings.futureRecordsPolicy = config.configurationValue;
            break;
          case 'TankStock.ShowDetailedWarnings':
            newSettings.showDetailedWarnings = config.configurationValue.toLowerCase() === 'true';
            break;
          case 'TankStock.MaxHistoricalDays':
            newSettings.maxHistoricalDays = parseInt(config.configurationValue) || 0;
            break;
          case 'TankStock.FutureRecords.MaxDaysBack':
            newSettings.maxHistoricalDays = parseInt(config.configurationValue) || 0;
            break;
          case 'TankStock.FutureRecords.AllowOverride':
            newSettings.allowOverride = config.configurationValue.toLowerCase() === 'true';
            break;
          case 'TankStock.FutureRecords.ShowRecordDetails':
            newSettings.showRecordDetails = config.configurationValue.toLowerCase() === 'true';
            break;
          case 'Tank.EnableSensorPhysicalStockUpdate':
            newSettings.enableSensorPhysicalStockUpdate = config.configurationValue.toLowerCase() === 'true';
            break;

          // Map BulkImport configuration values
          case 'TankStock.BulkImport.DefaultDuplicateHandling':
            newBulkImportSettings.defaultDuplicateHandling = config.configurationValue;
            break;
          case 'TankStock.BulkImport.AllowWarningImport':
            newBulkImportSettings.allowWarningImport = config.configurationValue === 'true';
            break;
          case 'TankStock.BulkImport.MaxBatchSize':
            newBulkImportSettings.maxBatchSize = parseInt(config.configurationValue) || 1000;
            break;
          case 'TankStock.BulkImport.EnableAutoValidation':
            newBulkImportSettings.enableAutoValidation = config.configurationValue === 'true';
            break;
          case 'TankStock.BulkImport.StockContinuity.Enabled':
            newBulkImportSettings.stockContinuityEnabled = config.configurationValue === 'true';
            break;
          case 'TankStock.BulkImport.StockContinuity.ThresholdLiters':
            newBulkImportSettings.stockContinuityThresholdLiters = parseFloat(config.configurationValue) || 500;
            break;
          case 'TankStock.BulkImport.StockContinuity.ThresholdPercent':
            newBulkImportSettings.stockContinuityThresholdPercent = parseFloat(config.configurationValue) || 10;
            break;
          case 'TankStock.BulkImport.BalanceEquation.Enabled':
            newBulkImportSettings.balanceEquationEnabled = config.configurationValue === 'true';
            break;
          case 'TankStock.BulkImport.BalanceEquation.TolerancePercent':
            newBulkImportSettings.balanceEquationTolerancePercent = parseFloat(config.configurationValue) || 2;
            break;
          case 'TankStock.BulkImport.BalanceEquation.MinVarianceLiters':
            newBulkImportSettings.balanceEquationMinVarianceLiters = parseFloat(config.configurationValue) || 10;
            break;
          case 'TankStock.BulkImport.MeterReadings.Enabled':
            newBulkImportSettings.meterReadingsEnabled = config.configurationValue === 'true';
            break;
          case 'TankStock.BulkImport.MeterReadings.TolerancePercent':
            newBulkImportSettings.meterReadingsTolerancePercent = parseFloat(config.configurationValue) || 5;
            break;
          case 'TankStock.BulkImport.MeterReadings.MinVarianceLiters':
            newBulkImportSettings.meterReadingsMinVarianceLiters = parseFloat(config.configurationValue) || 20;
            break;
          case 'TankStock.BulkImport.MeterReadings.AllowReset':
            newBulkImportSettings.meterReadingsAllowReset = config.configurationValue === 'true';
            break;
          case 'TankStock.BulkImport.TransferReciprocity.Enabled':
            newBulkImportSettings.transferReciprocityEnabled = config.configurationValue === 'true';
            break;
          case 'TankStock.BulkImport.TransferReciprocity.ToleranceLiters':
            newBulkImportSettings.transferReciprocityToleranceLiters = parseFloat(config.configurationValue) || 10;
            break;

          // Map Stock Management (Validation & Reconciliation) configuration values
          case 'Stock.VarianceThreshold.Percentage':
            newStockValidationSettings.varianceThresholdPercentage = parseFloat(config.configurationValue) || 5;
            break;
          case 'Stock.VarianceThreshold.AbsoluteLiters':
            newStockValidationSettings.varianceThresholdAbsoluteLiters = parseFloat(config.configurationValue) || 50;
            break;
          case 'Stock.EnableRealtimeValidation':
            newStockValidationSettings.enableRealtimeValidation = config.configurationValue.toLowerCase() === 'true';
            break;
          case 'Stock.ValidationDebounceMs':
            newStockValidationSettings.validationDebounceMs = parseInt(config.configurationValue) || 500;
            break;
          case 'Stock.RequireConfirmationOnHighVariance':
            newStockValidationSettings.requireConfirmationOnHighVariance = config.configurationValue.toLowerCase() === 'true';
            break;
          case 'TransferReconciliation.DefaultDaysRange':
            newStockValidationSettings.transferReconciliationDefaultDaysRange = parseInt(config.configurationValue) || 30;
            break;
          case 'TransferReconciliation.MaxPeriodsToAnalyze':
            newStockValidationSettings.transferReconciliationMaxPeriodsToAnalyze = parseInt(config.configurationValue) || 100;
            break;
          case 'TransferReconciliation.IncludeTransferDetailsDefault':
            newStockValidationSettings.transferReconciliationIncludeTransferDetailsDefault = config.configurationValue.toLowerCase() === 'true';
            break;
          default:
            break;
        }
      });

      setConfigMap(configMapping);
      setSettings(newSettings);
      setBulkImportSettings(newBulkImportSettings);
      setStockValidationSettings(newStockValidationSettings);
    }
  }, [configurations]);

  const handleSettingChange = useCallback((field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleBulkImportSettingChange = useCallback((field, value) => {
    setBulkImportSettings(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleStockValidationSettingChange = useCallback((field, value) => {
    setStockValidationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!hasAdminPermission) {
      notify('You do not have permission to modify these settings', 'error', 4000);
      return;
    }

    setSaving(true);
    try {
      const updates = [];

      // Map TankStock settings back to configurations
      const settingsToConfigMap = {
        futureRecordsPolicy: 'TankStock.FutureRecords.Policy',
        showDetailedWarnings: 'TankStock.ShowDetailedWarnings',
        maxHistoricalDays: 'TankStock.FutureRecords.MaxDaysBack',
        allowOverride: 'TankStock.FutureRecords.AllowOverride',
        showRecordDetails: 'TankStock.FutureRecords.ShowRecordDetails',
        enableSensorPhysicalStockUpdate: 'Tank.EnableSensorPhysicalStockUpdate'
      };

      // Map BulkImport settings back to configurations
      const bulkImportToConfigMap = {
        defaultDuplicateHandling: 'TankStock.BulkImport.DefaultDuplicateHandling',
        allowWarningImport: 'TankStock.BulkImport.AllowWarningImport',
        maxBatchSize: 'TankStock.BulkImport.MaxBatchSize',
        enableAutoValidation: 'TankStock.BulkImport.EnableAutoValidation',
        stockContinuityEnabled: 'TankStock.BulkImport.StockContinuity.Enabled',
        stockContinuityThresholdLiters: 'TankStock.BulkImport.StockContinuity.ThresholdLiters',
        stockContinuityThresholdPercent: 'TankStock.BulkImport.StockContinuity.ThresholdPercent',
        balanceEquationEnabled: 'TankStock.BulkImport.BalanceEquation.Enabled',
        balanceEquationTolerancePercent: 'TankStock.BulkImport.BalanceEquation.TolerancePercent',
        balanceEquationMinVarianceLiters: 'TankStock.BulkImport.BalanceEquation.MinVarianceLiters',
        meterReadingsEnabled: 'TankStock.BulkImport.MeterReadings.Enabled',
        meterReadingsTolerancePercent: 'TankStock.BulkImport.MeterReadings.TolerancePercent',
        meterReadingsMinVarianceLiters: 'TankStock.BulkImport.MeterReadings.MinVarianceLiters',
        meterReadingsAllowReset: 'TankStock.BulkImport.MeterReadings.AllowReset',
        transferReciprocityEnabled: 'TankStock.BulkImport.TransferReciprocity.Enabled',
        transferReciprocityToleranceLiters: 'TankStock.BulkImport.TransferReciprocity.ToleranceLiters'
      };

      // Map Stock Validation settings back to configurations
      const stockValidationToConfigMap = {
        varianceThresholdPercentage: 'Stock.VarianceThreshold.Percentage',
        varianceThresholdAbsoluteLiters: 'Stock.VarianceThreshold.AbsoluteLiters',
        enableRealtimeValidation: 'Stock.EnableRealtimeValidation',
        validationDebounceMs: 'Stock.ValidationDebounceMs',
        requireConfirmationOnHighVariance: 'Stock.RequireConfirmationOnHighVariance',
        transferReconciliationDefaultDaysRange: 'TransferReconciliation.DefaultDaysRange',
        transferReconciliationMaxPeriodsToAnalyze: 'TransferReconciliation.MaxPeriodsToAnalyze',
        transferReconciliationIncludeTransferDetailsDefault: 'TransferReconciliation.IncludeTransferDetailsDefault'
      };

      // Process TankStock settings
      for (const [settingKey, configKey] of Object.entries(settingsToConfigMap)) {
        const config = configMap[configKey];
        if (config) {
          let newValue = settings[settingKey];

          // Convert boolean to string
          if (typeof newValue === 'boolean') {
            newValue = newValue.toString();
          }
          // Convert number to string
          else if (typeof newValue === 'number') {
            newValue = newValue.toString();
          }

          // Only update if value changed
          if (newValue !== config.configurationValue) {
            updates.push(
              dispatch(updateSystemConfiguration({
                ...config,
                configurationValue: newValue
              }))
            );
          }
        }
      }

      // Process BulkImport settings
      for (const [settingKey, configKey] of Object.entries(bulkImportToConfigMap)) {
        const config = configMap[configKey];
        if (config) {
          let newValue = bulkImportSettings[settingKey];

          // Convert boolean to string
          if (typeof newValue === 'boolean') {
            newValue = newValue.toString();
          }
          // Convert number to string
          else if (typeof newValue === 'number') {
            newValue = newValue.toString();
          }

          // Only update if value changed
          if (newValue !== config.configurationValue) {
            updates.push(
              dispatch(updateSystemConfiguration({
                ...config,
                configurationValue: newValue
              }))
            );
          }
        }
      }

      // Process Stock Validation settings
      for (const [settingKey, configKey] of Object.entries(stockValidationToConfigMap)) {
        const config = configMap[configKey];
        if (config) {
          let newValue = stockValidationSettings[settingKey];

          // Convert boolean to string
          if (typeof newValue === 'boolean') {
            newValue = newValue.toString();
          }
          // Convert number to string
          else if (typeof newValue === 'number') {
            newValue = newValue.toString();
          }

          // Only update if value changed
          if (newValue !== config.configurationValue) {
            updates.push(
              dispatch(updateSystemConfiguration({
                ...config,
                configurationValue: newValue
              }))
            );
          }
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        notify('Tank Stock settings updated successfully', 'success', 3000);

        // Reload configurations
        dispatch(fetchSystemConfigurations({ category: 'TankStock' }));
        dispatch(fetchSystemConfigurations({ category: 'Tank Management' }));
        dispatch(fetchSystemConfigurations({ category: 'BulkImport' }));
        dispatch(fetchSystemConfigurations({ category: 'Stock Management' }));
      } else {
        notify('No changes to save', 'info', 2000);
      }
    } catch (error) {
      console.error('Error saving Tank Stock settings:', error);
      notify('Failed to update Tank Stock settings', 'error', 4000);
    } finally {
      setSaving(false);
    }
  }, [settings, bulkImportSettings, stockValidationSettings, configMap, hasAdminPermission, dispatch]);

  // Tab data
  const tabData = [
    { text: "General Settings", icon: "fa-light fa-cog" },
    { text: "Validation & Reconciliation", icon: "fa-light fa-check-circle" },
    { text: "Bulk Import", icon: "fa-light fa-file-upload" }
  ];

  // Custom tab item renderer
  const renderTabItem = (item) => {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={item.icon}></i>
        <span>{item.text}</span>
      </div>
    );
  };

  // Handle tab change and lazy loading
  const handleTabSelectionChange = (e) => {
    const newIndex = e.itemIndex;
    setSelectedTabIndex(newIndex);
    setLoadedTabs(prev => new Set([...prev, newIndex]));
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (selectedTabIndex) {
      case 0:
        return loadedTabs.has(0) && (
          <GeneralSettingsTab
            settings={settings}
            handleSettingChange={handleSettingChange}
          />
        );
      case 1:
        return loadedTabs.has(1) && (
          <ValidationSettingsTab
            stockValidationSettings={stockValidationSettings}
            handleStockValidationSettingChange={handleStockValidationSettingChange}
          />
        );
      case 2:
        return loadedTabs.has(2) && (
          <BulkImportSettingsTab
            bulkImportSettings={bulkImportSettings}
            handleBulkImportSettingChange={handleBulkImportSettingChange}
          />
        );
      default:
        return null;
    }
  };

  // Access denied view for non-admin users
  if (!hasAdminPermission) {
    return (
      <ScrollView className="tw-bg-gray-50 tw-min-h-screen">
        <div className="tw-p-6">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-8">
            <div className="tw-text-center">
              <i className="fa-light fa-lock tw-text-6xl tw-text-red-600 tw-mb-4"></i>
              <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mb-4">
                Access Denied
              </h2>
              <p className="tw-text-gray-600 tw-mb-6">
                You do not have permission to access Tank Stock settings.
              </p>
              <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
                <p className="tw-text-red-800 tw-font-medium">
                  <i className="fa-light fa-info-circle tw-mr-2"></i>
                  Admin permission is required to modify these settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollView>
    );
  }

  return (
    <div className="tw-bg-gray-50 tw-min-h-screen">
      <div className="tw-p-6">
        {/* Header */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-3">
                <i className="fa-light fa-cog tw-text-blue-600"></i>
                Tank Stock Settings
              </h1>
              <p className="tw-text-gray-600 tw-mt-2">
                Configure tank stock operations, validation rules, and system preferences
              </p>
            </div>
            <Button
              text="Save Settings"
              type="success"
              stylingMode="contained"
              icon="fa-light fa-save"
              onClick={handleSave}
              disabled={saving || loading}
            />
          </div>
        </div>

        {/* Settings Tabs */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-overflow-hidden">
          {loading ? (
            <div className="tw-text-center tw-py-8">
              <i className="fa fa-spinner fa-spin tw-text-4xl tw-text-blue-600"></i>
              <p className="tw-text-gray-600 tw-mt-4">Loading settings...</p>
            </div>
          ) : (
            <>
              {/* Tabs Navigation */}
              <Tabs
                dataSource={tabData}
                selectedIndex={selectedTabIndex}
                onItemClick={handleTabSelectionChange}
                width="100%"
                className="tw-mb-0"
                itemRender={renderTabItem}
              />

              {/* Tab Content */}
              <div className="tw-p-4">
                {renderContent()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TankStockSettings;