/**
 * File: IssueMonitoringSystemConfigTab.js
 * Purpose: Provides Issue Tracker auto-monitoring system configuration editor
 * Dependencies: React, Redux, DevExtreme button/load-indicator, systemConfig actions, issueTrackerService
 * Last Modified: 2026-02-12
 *
 * Key Functions:
 * - loadConfigurations: Loads IssueTracker category system settings
 * - handleSave: Validates and saves all editable monitoring settings
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import {
  fetchSystemConfigurations,
  updateSystemConfiguration
} from '../../../redux/actions/systemConfigActions';
import issueTrackerService from '../../../services/issueTrackerService';

const ISSUE_MONITORING_KEYS = [
  'IssueTracker.AutoMonitoring.Enabled',
  'IssueTracker.AutoMonitoring.VehicleOfflineThresholdMinutes',
  'IssueTracker.AutoMonitoring.PTSOfflineThresholdMinutes',
  'IssueTracker.AutoMonitoring.FuelActivityWindowMinutes',
  'IssueTracker.AutoMonitoring.DefaultIssueCategoryId'
];

const getDataType = (config) => (config?.dataType || 'String').toLowerCase();

const isBooleanType = (config) => {
  const dataType = getDataType(config);
  return dataType === 'boolean' || dataType === 'bool';
};

const isNumberType = (config) => {
  const dataType = getDataType(config);
  return dataType === 'int' || dataType === 'integer' || dataType === 'number' || dataType === 'double';
};

const toBooleanString = (value) => {
  const text = String(value).trim().toLowerCase();
  return text === 'true' ? 'true' : 'false';
};

const IssueMonitoringSystemConfigTab = () => {
  const dispatch = useDispatch();
  const { configurations, loading, saving } = useSelector((state) => state.systemConfig);
  const [issueCategories, setIssueCategories] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const loadConfigurations = useCallback(async () => {
    try {
      await dispatch(fetchSystemConfigurations({
        page: 1,
        pageSize: 200,
        category: 'IssueTracker'
      }));
    } catch (error) {
      notify({
        message: 'Failed to load issue monitoring settings.',
        type: 'error',
        displayTime: 3500
      });
    }
  }, [dispatch]);

  const loadIssueCategories = useCallback(async () => {
    try {
      const response = await issueTrackerService.getIssueCategories();
      const categoryData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setIssueCategories(categoryData);
    } catch (error) {
      setIssueCategories([]);
      notify({
        message: 'Failed to load issue categories.',
        type: 'warning',
        displayTime: 3000
      });
    }
  }, []);

  useEffect(() => {
    loadConfigurations();
    loadIssueCategories();
  }, [loadConfigurations, loadIssueCategories]);

  const issueConfigs = useMemo(() => {
    const configList = Array.isArray(configurations) ? configurations : [];
    const configMap = new Map(configList.map((config) => [config.configurationKey, config]));

    return ISSUE_MONITORING_KEYS
      .map((key) => configMap.get(key))
      .filter((config) => Boolean(config));
  }, [configurations]);

  const configByKey = useMemo(() => {
    return issueConfigs.reduce((acc, config) => {
      acc[config.configurationKey] = config;
      return acc;
    }, {});
  }, [issueConfigs]);

  useEffect(() => {
    if (!issueConfigs.length) {
      return;
    }

    setFormValues((prev) => {
      const next = {
        Enabled: toBooleanString(configByKey['IssueTracker.AutoMonitoring.Enabled']?.configurationValue ?? 'true') === 'true',
        VehicleOfflineThresholdMinutes: String(configByKey['IssueTracker.AutoMonitoring.VehicleOfflineThresholdMinutes']?.configurationValue ?? '60'),
        PTSOfflineThresholdMinutes: String(configByKey['IssueTracker.AutoMonitoring.PTSOfflineThresholdMinutes']?.configurationValue ?? '30'),
        FuelActivityWindowMinutes: String(configByKey['IssueTracker.AutoMonitoring.FuelActivityWindowMinutes']?.configurationValue ?? '4320'),
        DefaultIssueCategoryId: String(configByKey['IssueTracker.AutoMonitoring.DefaultIssueCategoryId']?.configurationValue ?? '')
      };

      return {
        ...next,
        ...prev
      };
    });
  }, [issueConfigs, configByKey]);

  const setFieldValue = useCallback((field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value
    }));

    setValidationErrors((prev) => ({
      ...prev,
      [field]: ''
    }));
  }, []);

  const validateNumberField = useCallback((field, label, config) => {
    const rawValue = String(formValues[field] ?? '').trim();
    if (!rawValue) {
      return `${label} is required.`;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return `${label} must be a valid whole number.`;
    }

    if (config?.minValue !== null && config?.minValue !== undefined && parsed < Number(config.minValue)) {
      return `${label} must be at least ${config.minValue}.`;
    }

    if (config?.maxValue !== null && config?.maxValue !== undefined && parsed > Number(config.maxValue)) {
      return `${label} must be at most ${config.maxValue}.`;
    }

    return '';
  }, [formValues]);

  const validateForm = useCallback(() => {
    const nextErrors = {};

    nextErrors.VehicleOfflineThresholdMinutes = validateNumberField(
      'VehicleOfflineThresholdMinutes',
      'Vehicle offline threshold',
      configByKey['IssueTracker.AutoMonitoring.VehicleOfflineThresholdMinutes']
    );

    nextErrors.PTSOfflineThresholdMinutes = validateNumberField(
      'PTSOfflineThresholdMinutes',
      'PTS offline threshold',
      configByKey['IssueTracker.AutoMonitoring.PTSOfflineThresholdMinutes']
    );

    nextErrors.FuelActivityWindowMinutes = validateNumberField(
      'FuelActivityWindowMinutes',
      'Fuel activity window',
      configByKey['IssueTracker.AutoMonitoring.FuelActivityWindowMinutes']
    );

    if (!String(formValues.DefaultIssueCategoryId ?? '').trim()) {
      nextErrors.DefaultIssueCategoryId = 'Default issue category is required.';
    }

    setValidationErrors(nextErrors);

    return Object.values(nextErrors).every((message) => !message);
  }, [configByKey, formValues, validateNumberField]);

  const buildSavePayload = useCallback(() => {
    const entries = [
      {
        key: 'IssueTracker.AutoMonitoring.Enabled',
        value: formValues.Enabled ? 'true' : 'false'
      },
      {
        key: 'IssueTracker.AutoMonitoring.VehicleOfflineThresholdMinutes',
        value: String(formValues.VehicleOfflineThresholdMinutes).trim()
      },
      {
        key: 'IssueTracker.AutoMonitoring.PTSOfflineThresholdMinutes',
        value: String(formValues.PTSOfflineThresholdMinutes).trim()
      },
      {
        key: 'IssueTracker.AutoMonitoring.FuelActivityWindowMinutes',
        value: String(formValues.FuelActivityWindowMinutes).trim()
      },
      {
        key: 'IssueTracker.AutoMonitoring.DefaultIssueCategoryId',
        value: String(formValues.DefaultIssueCategoryId).trim()
      }
    ];

    return entries
      .map((item) => {
        const config = configByKey[item.key];
        if (!config || config.isEditable !== true) {
          return null;
        }

        return {
          ...config,
          id: config.id,
          configurationValue: item.value
        };
      })
      .filter((item) => Boolean(item));
  }, [configByKey, formValues]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      notify({
        message: 'Please correct the highlighted validation errors before saving.',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    const payloads = buildSavePayload();
    if (!payloads.length) {
      notify({
        message: 'No editable issue monitoring settings were found to save.',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    try {
      setIsSaving(true);
      for (const payload of payloads) {
        await dispatch(updateSystemConfiguration(payload));
      }

      notify({
        message: 'Issue monitoring settings saved successfully.',
        type: 'success',
        displayTime: 2500
      });

      await loadConfigurations();
    } catch (error) {
      notify({
        message: 'Failed to save issue monitoring settings.',
        type: 'error',
        displayTime: 3500
      });
    } finally {
      setIsSaving(false);
    }
  }, [buildSavePayload, dispatch, loadConfigurations, validateForm]);

  const handleReset = useCallback(() => {
    setValidationErrors({});
    setFormValues({
      Enabled: toBooleanString(configByKey['IssueTracker.AutoMonitoring.Enabled']?.configurationValue ?? 'true') === 'true',
      VehicleOfflineThresholdMinutes: String(configByKey['IssueTracker.AutoMonitoring.VehicleOfflineThresholdMinutes']?.configurationValue ?? '60'),
      PTSOfflineThresholdMinutes: String(configByKey['IssueTracker.AutoMonitoring.PTSOfflineThresholdMinutes']?.configurationValue ?? '30'),
      FuelActivityWindowMinutes: String(configByKey['IssueTracker.AutoMonitoring.FuelActivityWindowMinutes']?.configurationValue ?? '4320'),
      DefaultIssueCategoryId: String(configByKey['IssueTracker.AutoMonitoring.DefaultIssueCategoryId']?.configurationValue ?? '')
    });
  }, [configByKey]);

  const getCategoryNameById = useCallback((categoryId) => {
    const found = issueCategories.find((category) => String(category.id) === String(categoryId));
    return found?.name || 'Unknown category';
  }, [issueCategories]);

  if (loading && !issueConfigs.length) {
    return (
      <div className="tw-flex tw-items-center tw-gap-3 tw-p-4 tw-text-gray-600">
        <LoadIndicator width={24} height={24} visible={true} />
        <span>Loading issue system configuration...</span>
      </div>
    );
  }

  if (!issueConfigs.length) {
    return (
      <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-4">
        <div className="tw-flex tw-items-start tw-gap-3">
          <i className="fa-light fa-triangle-exclamation tw-text-yellow-700 tw-mt-0.5"></i>
          <div>
            <p className="tw-font-medium tw-text-yellow-800">No Issue Monitoring settings found.</p>
            <p className="tw-text-sm tw-text-yellow-700 tw-mt-1">
              Please ensure IssueTracker system configuration keys are seeded in the database.
            </p>
            <Button
              text="Reload"
              type="normal"
              stylingMode="outlined"
              icon="fa-light fa-rotate"
              onClick={async () => {
                await loadConfigurations();
                await loadIssueCategories();
              }}
              className="tw-mt-3"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-space-y-4">
      <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
        <div>
          <p className="tw-font-semibold tw-text-blue-800">Issue Monitoring System Configuration</p>
          <p className="tw-text-sm tw-text-blue-700 tw-mt-1">
            Configure auto-monitoring behavior for GPS, vehicle, fuel checks, and default issue category selection.
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button
            text="Reload"
            type="normal"
            stylingMode="outlined"
            icon="fa-light fa-rotate"
            onClick={async () => {
              await loadConfigurations();
              await loadIssueCategories();
            }}
          />
          <Button
            text="Reset"
            type="normal"
            stylingMode="outlined"
            icon="fa-light fa-undo"
            onClick={handleReset}
            disabled={isSaving || saving}
          />
          <Button
            text={isSaving || saving ? 'Saving...' : 'Save Changes'}
            type="default"
            stylingMode="contained"
            icon="fa-light fa-floppy-disk"
            onClick={handleSave}
            disabled={isSaving || saving}
          />
        </div>
      </div>

      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-5 tw-space-y-5">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
          <div className="md:tw-col-span-2 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-start tw-gap-3">
              <input
                id="issue-monitoring-enabled"
                type="checkbox"
                checked={Boolean(formValues.Enabled)}
                onChange={(event) => setFieldValue('Enabled', event.target.checked)}
                disabled={isSaving || saving}
                className="tw-mt-1 tw-h-4 tw-w-4 tw-cursor-pointer"
              />
              <div>
                <label htmlFor="issue-monitoring-enabled" className="tw-font-medium tw-text-gray-800 tw-cursor-pointer">
                  Enable automatic Issue Monitoring
                </label>
                <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                  When enabled, the background service automatically creates issues for configured offline/activity conditions.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="vehicle-offline-threshold" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Vehicle Offline Threshold (minutes)
            </label>
            <input
              id="vehicle-offline-threshold"
              type="number"
              min={Number(configByKey['IssueTracker.AutoMonitoring.VehicleOfflineThresholdMinutes']?.minValue ?? 1)}
              max={Number(configByKey['IssueTracker.AutoMonitoring.VehicleOfflineThresholdMinutes']?.maxValue ?? 10080)}
              value={formValues.VehicleOfflineThresholdMinutes ?? ''}
              onChange={(event) => setFieldValue('VehicleOfflineThresholdMinutes', event.target.value)}
              disabled={isSaving || saving}
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm"
            />
            {validationErrors.VehicleOfflineThresholdMinutes ? (
              <p className="tw-text-red-600 tw-text-xs tw-mt-1">{validationErrors.VehicleOfflineThresholdMinutes}</p>
            ) : (
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                Used when template offline threshold is empty.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="pts-offline-threshold" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              PTS Offline Threshold (minutes)
            </label>
            <input
              id="pts-offline-threshold"
              type="number"
              min={Number(configByKey['IssueTracker.AutoMonitoring.PTSOfflineThresholdMinutes']?.minValue ?? 1)}
              max={Number(configByKey['IssueTracker.AutoMonitoring.PTSOfflineThresholdMinutes']?.maxValue ?? 10080)}
              value={formValues.PTSOfflineThresholdMinutes ?? ''}
              onChange={(event) => setFieldValue('PTSOfflineThresholdMinutes', event.target.value)}
              disabled={isSaving || saving}
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm"
            />
            {validationErrors.PTSOfflineThresholdMinutes ? (
              <p className="tw-text-red-600 tw-text-xs tw-mt-1">{validationErrors.PTSOfflineThresholdMinutes}</p>
            ) : (
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                Used when template offline threshold is empty.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="fuel-window" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Fuel Activity Window (minutes)
            </label>
            <input
              id="fuel-window"
              type="number"
              min={Number(configByKey['IssueTracker.AutoMonitoring.FuelActivityWindowMinutes']?.minValue ?? 60)}
              max={Number(configByKey['IssueTracker.AutoMonitoring.FuelActivityWindowMinutes']?.maxValue ?? 43200)}
              value={formValues.FuelActivityWindowMinutes ?? ''}
              onChange={(event) => setFieldValue('FuelActivityWindowMinutes', event.target.value)}
              disabled={isSaving || saving}
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm"
            />
            {validationErrors.FuelActivityWindowMinutes ? (
              <p className="tw-text-red-600 tw-text-xs tw-mt-1">{validationErrors.FuelActivityWindowMinutes}</p>
            ) : (
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                Lookback window for fuel-while-offline checks.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="default-issue-category" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Default Issue Category
            </label>
            <select
              id="default-issue-category"
              value={String(formValues.DefaultIssueCategoryId ?? '')}
              onChange={(event) => setFieldValue('DefaultIssueCategoryId', event.target.value)}
              disabled={isSaving || saving}
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-bg-white"
            >
              <option value="">Select issue category...</option>
              {issueCategories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
            {validationErrors.DefaultIssueCategoryId ? (
              <p className="tw-text-red-600 tw-text-xs tw-mt-1">{validationErrors.DefaultIssueCategoryId}</p>
            ) : (
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                Used for auto-created issues when template category is not specified.
              </p>
            )}
          </div>
        </div>

        {!!formValues.DefaultIssueCategoryId && (
          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-md tw-p-3 tw-text-sm tw-text-gray-700">
            Selected default category: <span className="tw-font-semibold">{getCategoryNameById(formValues.DefaultIssueCategoryId)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueMonitoringSystemConfigTab;
