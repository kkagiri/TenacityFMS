import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import notify from 'devextreme/ui/notify';
import {
  fetchSystemConfigurations,
  updateSystemConfiguration
} from '../../../../redux/actions/systemConfigActions';

export const useSettingsConfiguration = (hasAdminPermission) => {
  const dispatch = useDispatch();
  const { configurations, loading } = useSelector((state) => state.systemConfig);

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
    showAdvancedOptions: false,
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

  // Fetch configurations
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
      const newSettings = { ...settings };
      const newBulkImportSettings = { ...bulkImportSettings };
      const newStockValidationSettings = { ...stockValidationSettings };

      configurations.forEach(config => {
        configMapping[config.configurationKey] = config;

        // Map configurations based on key
        mapConfiguration(config, newSettings, newBulkImportSettings, newStockValidationSettings);
      });

      setConfigMap(configMapping);
      setSettings(newSettings);
      setBulkImportSettings(newBulkImportSettings);
      setStockValidationSettings(newStockValidationSettings);
    }
  }, [configurations]);

  const mapConfiguration = (config, newSettings, newBulkImportSettings, newStockValidationSettings) => {
    const key = config.configurationKey;
    const value = config.configurationValue;

    // General Settings
    if (key === 'TankStock.FutureRecords.Policy') newSettings.futureRecordsPolicy = value;
    else if (key === 'TankStock.ShowDetailedWarnings') newSettings.showDetailedWarnings = value.toLowerCase() === 'true';
    else if (key === 'TankStock.MaxHistoricalDays' || key === 'TankStock.FutureRecords.MaxDaysBack') newSettings.maxHistoricalDays = parseInt(value) || 0;
    else if (key === 'TankStock.FutureRecords.AllowOverride') newSettings.allowOverride = value.toLowerCase() === 'true';
    else if (key === 'TankStock.FutureRecords.ShowRecordDetails') newSettings.showRecordDetails = value.toLowerCase() === 'true';
    else if (key === 'Tank.EnableSensorPhysicalStockUpdate') newSettings.enableSensorPhysicalStockUpdate = value.toLowerCase() === 'true';

    // Bulk Import Settings
    else if (key === 'TankStock.BulkImport.DefaultDuplicateHandling') newBulkImportSettings.defaultDuplicateHandling = value;
    else if (key === 'TankStock.BulkImport.AllowWarningImport') newBulkImportSettings.allowWarningImport = value === 'true';
    else if (key === 'TankStock.BulkImport.MaxBatchSize') newBulkImportSettings.maxBatchSize = parseInt(value) || 1000;
    else if (key === 'TankStock.BulkImport.EnableAutoValidation') newBulkImportSettings.enableAutoValidation = value === 'true';
    else if (key === 'TankStock.BulkImport.ShowAdvancedOptions') newBulkImportSettings.showAdvancedOptions = value === 'true';
    else if (key === 'TankStock.BulkImport.StockContinuity.Enabled') newBulkImportSettings.stockContinuityEnabled = value === 'true';
    else if (key === 'TankStock.BulkImport.StockContinuity.ThresholdLiters') newBulkImportSettings.stockContinuityThresholdLiters = parseFloat(value) || 500;
    else if (key === 'TankStock.BulkImport.StockContinuity.ThresholdPercent') newBulkImportSettings.stockContinuityThresholdPercent = parseFloat(value) || 10;
    else if (key === 'TankStock.BulkImport.BalanceEquation.Enabled') newBulkImportSettings.balanceEquationEnabled = value === 'true';
    else if (key === 'TankStock.BulkImport.BalanceEquation.TolerancePercent') newBulkImportSettings.balanceEquationTolerancePercent = parseFloat(value) || 2;
    else if (key === 'TankStock.BulkImport.BalanceEquation.MinVarianceLiters') newBulkImportSettings.balanceEquationMinVarianceLiters = parseFloat(value) || 10;
    else if (key === 'TankStock.BulkImport.MeterReadings.Enabled') newBulkImportSettings.meterReadingsEnabled = value === 'true';
    else if (key === 'TankStock.BulkImport.MeterReadings.TolerancePercent') newBulkImportSettings.meterReadingsTolerancePercent = parseFloat(value) || 5;
    else if (key === 'TankStock.BulkImport.MeterReadings.MinVarianceLiters') newBulkImportSettings.meterReadingsMinVarianceLiters = parseFloat(value) || 20;
    else if (key === 'TankStock.BulkImport.MeterReadings.AllowReset') newBulkImportSettings.meterReadingsAllowReset = value === 'true';
    else if (key === 'TankStock.BulkImport.TransferReciprocity.Enabled') newBulkImportSettings.transferReciprocityEnabled = value === 'true';
    else if (key === 'TankStock.BulkImport.TransferReciprocity.ToleranceLiters') newBulkImportSettings.transferReciprocityToleranceLiters = parseFloat(value) || 10;

    // Validation Settings
    else if (key === 'Stock.VarianceThreshold.Percentage') newStockValidationSettings.varianceThresholdPercentage = parseFloat(value) || 5;
    else if (key === 'Stock.VarianceThreshold.AbsoluteLiters') newStockValidationSettings.varianceThresholdAbsoluteLiters = parseFloat(value) || 50;
    else if (key === 'Stock.EnableRealtimeValidation') newStockValidationSettings.enableRealtimeValidation = value.toLowerCase() === 'true';
    else if (key === 'Stock.ValidationDebounceMs') newStockValidationSettings.validationDebounceMs = parseInt(value) || 500;
    else if (key === 'Stock.RequireConfirmationOnHighVariance') newStockValidationSettings.requireConfirmationOnHighVariance = value.toLowerCase() === 'true';
    else if (key === 'TransferReconciliation.DefaultDaysRange') newStockValidationSettings.transferReconciliationDefaultDaysRange = parseInt(value) || 30;
    else if (key === 'TransferReconciliation.MaxPeriodsToAnalyze') newStockValidationSettings.transferReconciliationMaxPeriodsToAnalyze = parseInt(value) || 100;
    else if (key === 'TransferReconciliation.IncludeTransferDetailsDefault') newStockValidationSettings.transferReconciliationIncludeTransferDetailsDefault = value.toLowerCase() === 'true';
  };

  const handleSettingChange = useCallback((field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleBulkImportSettingChange = useCallback((field, value) => {
    setBulkImportSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleStockValidationSettingChange = useCallback((field, value) => {
    setStockValidationSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!hasAdminPermission) {
      notify('You do not have permission to modify these settings', 'error', 4000);
      return;
    }

    setSaving(true);
    try {
      const updates = [];

      // Configuration mappings
      const settingsMap = {
        futureRecordsPolicy: 'TankStock.FutureRecords.Policy',
        showDetailedWarnings: 'TankStock.ShowDetailedWarnings',
        maxHistoricalDays: 'TankStock.FutureRecords.MaxDaysBack',
        allowOverride: 'TankStock.FutureRecords.AllowOverride',
        showRecordDetails: 'TankStock.FutureRecords.ShowRecordDetails',
        enableSensorPhysicalStockUpdate: 'Tank.EnableSensorPhysicalStockUpdate'
      };

      const bulkImportMap = {
        defaultDuplicateHandling: 'TankStock.BulkImport.DefaultDuplicateHandling',
        allowWarningImport: 'TankStock.BulkImport.AllowWarningImport',
        maxBatchSize: 'TankStock.BulkImport.MaxBatchSize',
        enableAutoValidation: 'TankStock.BulkImport.EnableAutoValidation',
        showAdvancedOptions: 'TankStock.BulkImport.ShowAdvancedOptions',
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

      const validationMap = {
        varianceThresholdPercentage: 'Stock.VarianceThreshold.Percentage',
        varianceThresholdAbsoluteLiters: 'Stock.VarianceThreshold.AbsoluteLiters',
        enableRealtimeValidation: 'Stock.EnableRealtimeValidation',
        validationDebounceMs: 'Stock.ValidationDebounceMs',
        requireConfirmationOnHighVariance: 'Stock.RequireConfirmationOnHighVariance',
        transferReconciliationDefaultDaysRange: 'TransferReconciliation.DefaultDaysRange',
        transferReconciliationMaxPeriodsToAnalyze: 'TransferReconciliation.MaxPeriodsToAnalyze',
        transferReconciliationIncludeTransferDetailsDefault: 'TransferReconciliation.IncludeTransferDetailsDefault'
      };

      // Process all settings
      const processSettings = (settingsObj, map) => {
        for (const [key, configKey] of Object.entries(map)) {
          const config = configMap[configKey];
          if (config) {
            let newValue = settingsObj[key];
            if (typeof newValue === 'boolean') newValue = newValue.toString();
            else if (typeof newValue === 'number') newValue = newValue.toString();

            if (newValue !== config.configurationValue) {
              updates.push(dispatch(updateSystemConfiguration({ ...config, configurationValue: newValue })));
            }
          }
        }
      };

      processSettings(settings, settingsMap);
      processSettings(bulkImportSettings, bulkImportMap);
      processSettings(stockValidationSettings, validationMap);

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

  return {
    settings,
    stockValidationSettings,
    bulkImportSettings,
    loading,
    saving,
    handleSettingChange,
    handleBulkImportSettingChange,
    handleStockValidationSettingChange,
    handleSave
  };
};
