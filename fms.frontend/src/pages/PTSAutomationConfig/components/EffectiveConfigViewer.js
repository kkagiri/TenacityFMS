//Cursor - Effective Configuration Viewer component for PTS Automation
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LoadPanel } from "devextreme-react/load-panel";
import { Button } from "devextreme-react/button";
import notify from "devextreme/ui/notify";

//Cursor - EffectiveConfigViewer component
const EffectiveConfigViewer = ({ siteId, onClose }) => {
  const dispatch = useDispatch();
  const { configurations } = useSelector((state) => state.ptsAutomationConfig);
  const { sites } = useSelector((state) => state.site);

  const [loading, setLoading] = useState(true);
  const [effectiveConfig, setEffectiveConfig] = useState(null);
  const [configSources, setConfigSources] = useState({});

  useEffect(() => {
    if (siteId && configurations) {
      calculateEffectiveConfig();
    }
  }, [siteId, configurations]);

  const calculateEffectiveConfig = () => {
    try {
      setLoading(true);

      // Find site-specific configuration
      const siteConfig = configurations.find(config =>
        config.siteId === siteId && config.isActive
      );

      // Find global configuration (fallback)
      const globalConfig = configurations.find(config =>
        config.isGlobal && config.isActive
      );

      if (!siteConfig && !globalConfig) {
        notify("No active configuration found for this site", "warning", 3000);
        setEffectiveConfig(null);
        setLoading(false);
        return;
      }

      // Build effective configuration with source tracking
      const effective = {};
      const sources = {};

      // Configuration fields to resolve
      const configFields = [
        'autoCreateLedgerEntries',
        'checkForDuplicateManualEntries',
        'duplicateCheckHours',
        'updateTankVolumeFromBookKeeping',
        'usePtsProbeReadings',
        'volumeSourcePriority',
        'autoReconcileTankVolumes',
        'reconciliationFrequencyMinutes',
        'maxVolumeDiscrepancyThreshold',
        'discrepancyAction',
        'duplicateVolumeTolerance'
      ];

      configFields.forEach(field => {
        if (siteConfig && siteConfig.hasOwnProperty(field)) {
          effective[field] = siteConfig[field];
          sources[field] = 'site-specific';
        } else if (globalConfig && globalConfig.hasOwnProperty(field)) {
          effective[field] = globalConfig[field];
          sources[field] = 'global';
        } else {
          // Default values
          const defaults = {
            autoCreateLedgerEntries: true,
            checkForDuplicateManualEntries: true,
            duplicateCheckHours: 24,
            updateTankVolumeFromBookKeeping: true,
            usePtsProbeReadings: false,
            volumeSourcePriority: 1,
            autoReconcileTankVolumes: false,
            reconciliationFrequencyMinutes: 60,
            maxVolumeDiscrepancyThreshold: 10.0,
            discrepancyAction: 1,
            duplicateVolumeTolerance: 0.01
          };
          effective[field] = defaults[field];
          sources[field] = 'default';
        }
      });

      // Add metadata
      effective.siteId = siteId;
      effective.siteName = sites?.find(s => s.id === siteId)?.name || 'Unknown Site';
      effective.configurationName = siteConfig?.name || globalConfig?.name || 'Default Configuration';
      effective.lastModified = siteConfig?.modifiedOn || globalConfig?.modifiedOn ||
                               siteConfig?.createdOn || globalConfig?.createdOn;

      setEffectiveConfig(effective);
      setConfigSources(sources);

    } catch (error) {
      console.error("Error calculating effective configuration:", error);
      notify("Error calculating effective configuration", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const getSourceBadge = (source) => {
    const badges = {
      'site-specific': 'tw-bg-blue-100 tw-text-blue-800 tw-text-xs tw-px-2 tw-py-1 tw-rounded-full',
      'global': 'tw-bg-green-100 tw-text-green-800 tw-text-xs tw-px-2 tw-py-1 tw-rounded-full',
      'default': 'tw-bg-gray-100 tw-text-gray-600 tw-text-xs tw-px-2 tw-py-1 tw-rounded-full'
    };

    const labels = {
      'site-specific': 'Site Config',
      'global': 'Global Config',
      'default': 'System Default'
    };

    return (
      <span className={badges[source]}>
        {labels[source]}
      </span>
    );
  };

  const formatValue = (value, field) => {
    if (typeof value === 'boolean') {
      return (
        <i className={`fa-light ${value ? 'fa-check tw-text-green-600' : 'fa-times tw-text-red-600'}`} />
      );
    }

    if (field === 'volumeSourcePriority') {
      return value === 1 ? 'Book Keeping' : 'PTS Probe';
    }

    if (field === 'discrepancyAction') {
      const actions = { 1: 'Alert', 2: 'Block', 3: 'Auto-Adjust' };
      return actions[value] || value;
    }

    if (field === 'duplicateVolumeTolerance') {
      return `${(value * 100).toFixed(2)}%`;
    }

    return value;
  };

  if (loading) {
    return <LoadPanel visible={true} message="Calculating effective configuration..." />;
  }

  if (!effectiveConfig) {
    return (
      <div className="tw-p-6 tw-text-center">
        <i className="fa-light fa-exclamation-triangle tw-text-yellow-500 tw-text-4xl tw-mb-4" />
        <h3 className="tw-text-lg tw-font-semibold tw-mb-2">No Configuration Found</h3>
        <p className="tw-text-gray-600 tw-mb-4">
          No active configuration found for this site. Please create a site-specific or global configuration.
        </p>
        <Button
          text="Close"
          type="normal"
          onClick={onClose}
          className="tw-btn tw-btn-outline"
        />
      </div>
    );
  }

  return (
    <div className="tw-p-6">
      {/* Header */}
      <div className="tw-mb-6">
        <h3 className="tw-text-xl tw-font-bold tw-text-gray-800 tw-mb-2">
          Effective Configuration
        </h3>
        <div className="tw-text-sm tw-text-gray-600">
          <p><strong>Site:</strong> {effectiveConfig.siteName} (ID: {effectiveConfig.siteId})</p>
          <p><strong>Configuration:</strong> {effectiveConfig.configurationName}</p>
          {effectiveConfig.lastModified && (
            <p><strong>Last Modified:</strong> {new Date(effectiveConfig.lastModified).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Configuration Settings */}
      <div className="tw-space-y-4">
        <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
          <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
            <i className="fa-light fa-cogs tw-mr-2" />
            Automation Settings
          </h4>
          <div className="tw-grid tw-grid-cols-1 tw-gap-3">
            <div className="tw-flex tw-justify-between tw-items-center">
              <span className="tw-text-sm">Auto Create Ledger Entries:</span>
              <div className="tw-flex tw-items-center tw-gap-2">
                {formatValue(effectiveConfig.autoCreateLedgerEntries, 'autoCreateLedgerEntries')}
                {getSourceBadge(configSources.autoCreateLedgerEntries)}
              </div>
            </div>

            <div className="tw-flex tw-justify-between tw-items-center">
              <span className="tw-text-sm">Check for Duplicate Manual Entries:</span>
              <div className="tw-flex tw-items-center tw-gap-2">
                {formatValue(effectiveConfig.checkForDuplicateManualEntries, 'checkForDuplicateManualEntries')}
                {getSourceBadge(configSources.checkForDuplicateManualEntries)}
              </div>
            </div>

            <div className="tw-flex tw-justify-between tw-items-center">
              <span className="tw-text-sm">Duplicate Check Hours:</span>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span>{effectiveConfig.duplicateCheckHours}</span>
                {getSourceBadge(configSources.duplicateCheckHours)}
              </div>
            </div>
          </div>
        </div>

        <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
          <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
            <i className="fa-light fa-database tw-mr-2" />
            Volume Management
          </h4>
          <div className="tw-grid tw-grid-cols-1 tw-gap-3">
            <div className="tw-flex tw-justify-between tw-items-center">
              <span className="tw-text-sm">Update Tank Volume from Book Keeping:</span>
              <div className="tw-flex tw-items-center tw-gap-2">
                {formatValue(effectiveConfig.updateTankVolumeFromBookKeeping, 'updateTankVolumeFromBookKeeping')}
                {getSourceBadge(configSources.updateTankVolumeFromBookKeeping)}
              </div>
            </div>

            <div className="tw-flex tw-justify-between tw-items-center">
              <span className="tw-text-sm">Use PTS Probe Readings:</span>
              <div className="tw-flex tw-items-center tw-gap-2">
                {formatValue(effectiveConfig.usePtsProbeReadings, 'usePtsProbeReadings')}
                {getSourceBadge(configSources.usePtsProbeReadings)}
              </div>
            </div>

            <div className="tw-flex tw-justify-between tw-items-center">
              <span className="tw-text-sm">Volume Source Priority:</span>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span>{formatValue(effectiveConfig.volumeSourcePriority, 'volumeSourcePriority')}</span>
                {getSourceBadge(configSources.volumeSourcePriority)}
              </div>
            </div>

            <div className="tw-flex tw-justify-between tw-items-center">
              <span className="tw-text-sm">Duplicate Volume Tolerance:</span>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span>{formatValue(effectiveConfig.duplicateVolumeTolerance, 'duplicateVolumeTolerance')}</span>
                {getSourceBadge(configSources.duplicateVolumeTolerance)}
              </div>
            </div>
          </div>
        </div>

        <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
          <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
            <i className="fa-light fa-balance-scale tw-mr-2" />
            Reconciliation Settings
          </h4>
          <div className="tw-grid tw-grid-cols-1 tw-gap-3">
            <div className="tw-flex tw-justify-between tw-items-center">
              <span className="tw-text-sm">Auto Reconcile Tank Volumes:</span>
              <div className="tw-flex tw-items-center tw-gap-2">
                {formatValue(effectiveConfig.autoReconcileTankVolumes, 'autoReconcileTankVolumes')}
                {getSourceBadge(configSources.autoReconcileTankVolumes)}
              </div>
            </div>

            <div className="tw-flex tw-justify-between tw-items-center">
              <span className="tw-text-sm">Reconciliation Frequency (minutes):</span>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span>{effectiveConfig.reconciliationFrequencyMinutes}</span>
                {getSourceBadge(configSources.reconciliationFrequencyMinutes)}
              </div>
            </div>

            <div className="tw-flex tw-justify-between tw-items-center">
              <span className="tw-text-sm">Max Volume Discrepancy Threshold:</span>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span>{effectiveConfig.maxVolumeDiscrepancyThreshold}</span>
                {getSourceBadge(configSources.maxVolumeDiscrepancyThreshold)}
              </div>
            </div>

            <div className="tw-flex tw-justify-between tw-items-center">
              <span className="tw-text-sm">Discrepancy Action:</span>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span>{formatValue(effectiveConfig.discrepancyAction, 'discrepancyAction')}</span>
                {getSourceBadge(configSources.discrepancyAction)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="tw-flex tw-justify-end tw-mt-6">
        <Button
          text="Close"
          type="normal"
          onClick={onClose}
          className="tw-btn tw-btn-outline"
        />
      </div>
    </div>
  );
};

export default EffectiveConfigViewer;