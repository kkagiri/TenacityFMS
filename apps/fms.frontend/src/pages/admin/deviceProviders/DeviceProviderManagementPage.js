/**
 * File:          DeviceProviderManagementPage.js
 * Purpose:       Client-tenant device provider configuration and mapping page.
 * Dependencies:  React, axiosInstance, usePermissions, SCSS
 * Last Modified: 2026-05-15
 *
 * Key Functions:
 * - DeviceProviderManagementPage(): Lists, creates, edits, and maps tenant device providers.
 * - loadData(): Loads provider configurations and current mappings.
 * - saveProvider(): Persists provider create/update operations.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { usePermissions } from "../../../hooks/usePermissions";
import "./DeviceProviderManagementPage.scss";

const emptyProviderForm = {
  providerName: "",
  displayName: "",
  description: "",
  deviceCategory: "Tracking",
  configurationData: "{}",
  isEnabled: true,
  isDefault: false,
  priorityOrder: 999,
};

const emptyMappingForm = {
  vehicleId: "",
  providerId: "",
  externalDeviceId: "",
  deviceIMEI: "",
  deviceName: "",
  deviceType: "",
};

const unwrap = (payload) => payload?.data ?? payload?.Data ?? payload;

const normalizeProvider = (provider) => ({
  providerId: provider.providerId ?? provider.ProviderId,
  providerName: provider.providerName ?? provider.ProviderName,
  displayName: provider.displayName ?? provider.DisplayName,
  description: provider.description ?? provider.Description,
  deviceCategory: provider.deviceCategory ?? provider.DeviceCategory ?? "Tracking",
  isEnabled: provider.isEnabled ?? provider.IsEnabled ?? false,
  isDefault: provider.isDefault ?? provider.IsDefault ?? false,
  priorityOrder: provider.priorityOrder ?? provider.PriorityOrder ?? 999,
  configurationData: provider.configurationData ?? provider.ConfigurationData ?? "{}",
  updatedAt: provider.updatedAt ?? provider.UpdatedAt,
});

const normalizeMapping = (mapping) => ({
  vehicleId: mapping.vehicleId ?? mapping.VehicleId,
  vehicleName: mapping.vehicleName ?? mapping.VehicleName,
  numberPlate: mapping.numberPlate ?? mapping.NumberPlate,
  providerId: mapping.providerId ?? mapping.ProviderId,
  providerName: mapping.providerName ?? mapping.ProviderName,
  externalDeviceId: mapping.externalDeviceId ?? mapping.ExternalDeviceId,
  deviceIMEI: mapping.deviceIMEI ?? mapping.DeviceIMEI,
  deviceName: mapping.deviceName ?? mapping.DeviceName,
  deviceType: mapping.deviceType ?? mapping.DeviceType,
  mappedAt: mapping.mappedAt ?? mapping.MappedAt,
});

const formatDate = (value) => {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Never";
  return parsed.toLocaleString();
};

const getErrorMessage = (caught, fallback) =>
  caught?.response?.data?.message ||
  caught?.response?.data?.Message ||
  caught?.response?.data?.error ||
  caught?.response?.data?.Error ||
  fallback;

const DeviceProviderManagementPage = () => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("_Manage_DeviceProvider");
  const [providers, setProviders] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [providerForm, setProviderForm] = useState(emptyProviderForm);
  const [mappingForm, setMappingForm] = useState(emptyMappingForm);
  const [editingProviderId, setEditingProviderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const providerOptions = useMemo(
    () => providers.filter((provider) => provider.isEnabled),
    [providers]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [providersResponse, mappingsResponse] = await Promise.all([
        axiosInstance.get("/v1/providers/list"),
        axiosInstance.get("/v1/providers/mappings"),
      ]);

      const providerPayload = unwrap(providersResponse.data);
      const mappingPayload = unwrap(mappingsResponse.data);
      const providerRows = providerPayload?.data ?? providerPayload?.Data ?? providerPayload ?? [];
      const mappingRows = mappingPayload?.data ?? mappingPayload?.Data ?? mappingPayload ?? [];

      setProviders(providerRows.map(normalizeProvider));
      setMappings(mappingRows.map(normalizeMapping));
    } catch (caught) {
      setError(getErrorMessage(caught, "Unable to load device providers."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const editProvider = (provider) => {
    setEditingProviderId(provider.providerId);
    setProviderForm({
      providerName: provider.providerName,
      displayName: provider.displayName,
      description: provider.description || "",
      deviceCategory: provider.deviceCategory,
      configurationData: provider.configurationData || "{}",
      isEnabled: provider.isEnabled,
      isDefault: provider.isDefault,
      priorityOrder: provider.priorityOrder,
    });
    setMessage(null);
    setError(null);
  };

  const resetProviderForm = () => {
    setEditingProviderId(null);
    setProviderForm(emptyProviderForm);
  };

  const saveProvider = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        providerName: providerForm.providerName,
        displayName: providerForm.displayName,
        description: providerForm.description || null,
        deviceCategory: providerForm.deviceCategory,
        configurationData: providerForm.configurationData || "{}",
        isEnabled: providerForm.isEnabled,
        isDefault: providerForm.isDefault,
        priorityOrder: Number(providerForm.priorityOrder) || 999,
      };

      if (editingProviderId) {
        await axiosInstance.put(`/v1/providers/${editingProviderId}`, payload);
        setMessage("Provider updated.");
      } else {
        await axiosInstance.post("/v1/providers", payload);
        setMessage("Provider created.");
      }

      resetProviderForm();
      await loadData();
    } catch (caught) {
      setError(getErrorMessage(caught, "Unable to save provider."));
    } finally {
      setSaving(false);
    }
  };

  const saveMapping = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const selectedProvider = providers.find(
        (provider) => String(provider.providerId) === String(mappingForm.providerId)
      );

      await axiosInstance.post("/v1/providers/mappings/device", {
        vehicleId: Number(mappingForm.vehicleId),
        providerId: Number(mappingForm.providerId),
        providerName: selectedProvider?.providerName || null,
        externalDeviceId: mappingForm.externalDeviceId,
        deviceIMEI: mappingForm.deviceIMEI || null,
        deviceName: mappingForm.deviceName || null,
        deviceType: mappingForm.deviceType || null,
      });

      setMappingForm(emptyMappingForm);
      setMessage("Device mapping saved.");
      await loadData();
    } catch (caught) {
      setError(getErrorMessage(caught, "Unable to save device mapping."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="device-provider-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-network-wired m365-page-header__icon" />
          <h2 className="m365-page-header__title">
            Device providers
            <span className="m365-page-header__count">{providers.length}</span>
          </h2>
        </div>
        <div className="m365-page-header__actions">
          <button
            type="button"
            className="m365-btn m365-btn--ghost"
            onClick={loadData}
            disabled={loading}
          >
            <i className="fa-light fa-rotate-right" />
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div className="m365-info-banner m365-info-banner--success">
          <i className="fa-light fa-circle-check m365-info-banner__icon" />
          <span className="m365-info-banner__text">{message}</span>
        </div>
      )}

      {error && (
        <div className="m365-info-banner m365-info-banner--error">
          <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
          <span className="m365-info-banner__text">{error}</span>
        </div>
      )}

      <div className="device-provider-page__grid">
        <section className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-plug-circle-bolt m365-section-group__icon" />
            <h3 className="m365-section-group__title">Provider configurations</h3>
          </div>
          <div className="m365-section-group__body">
            {loading ? (
              <div className="device-provider-page__empty">Loading providers...</div>
            ) : providers.length === 0 ? (
              <div className="device-provider-page__empty">No providers configured.</div>
            ) : (
              <div className="device-provider-page__table-wrap">
                <table className="device-provider-page__table">
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Updated</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((provider) => (
                      <tr key={provider.providerId}>
                        <td>
                          <strong>{provider.displayName}</strong>
                          <span>{provider.providerName}</span>
                        </td>
                        <td>{provider.deviceCategory}</td>
                        <td>
                          <span className={`m365-badge ${provider.isEnabled ? "m365-badge--success" : "m365-badge--neutral"}`}>
                            {provider.isEnabled ? "Enabled" : "Disabled"}
                          </span>
                          {provider.isDefault && (
                            <span className="m365-badge m365-badge--primary">Default</span>
                          )}
                        </td>
                        <td>{provider.priorityOrder}</td>
                        <td>{formatDate(provider.updatedAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="m365-icon-btn"
                            onClick={() => editProvider(provider)}
                            disabled={!canManage}
                            title="Edit provider"
                          >
                            <i className="fa-light fa-pen-to-square" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-sliders m365-section-group__icon" />
            <h3 className="m365-section-group__title">
              {editingProviderId ? "Edit provider" : "Add provider"}
            </h3>
          </div>
          <form className="m365-section-group__body" onSubmit={saveProvider}>
            <label className="m365-field">
              Provider name
              <input
                className="m365-input"
                value={providerForm.providerName}
                disabled={!canManage || !!editingProviderId}
                onChange={(event) =>
                  setProviderForm((current) => ({ ...current, providerName: event.target.value }))
                }
              />
            </label>
            <label className="m365-field">
              Display name
              <input
                className="m365-input"
                value={providerForm.displayName}
                disabled={!canManage}
                onChange={(event) =>
                  setProviderForm((current) => ({ ...current, displayName: event.target.value }))
                }
              />
            </label>
            <label className="m365-field">
              Category
              <select
                className="m365-select"
                value={providerForm.deviceCategory}
                disabled={!canManage}
                onChange={(event) =>
                  setProviderForm((current) => ({ ...current, deviceCategory: event.target.value }))
                }
              >
                <option value="Tracking">Tracking</option>
                <option value="Fueling">Fueling</option>
                <option value="Atg">ATG</option>
              </select>
            </label>
            <label className="m365-field">
              Priority
              <input
                type="number"
                min="1"
                className="m365-input"
                value={providerForm.priorityOrder}
                disabled={!canManage}
                onChange={(event) =>
                  setProviderForm((current) => ({ ...current, priorityOrder: event.target.value }))
                }
              />
            </label>
            <label className="m365-field">
              Description
              <input
                className="m365-input"
                value={providerForm.description}
                disabled={!canManage}
                onChange={(event) =>
                  setProviderForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>
            <label className="m365-field">
              Configuration JSON
              <textarea
                className="m365-textarea"
                value={providerForm.configurationData}
                disabled={!canManage}
                onChange={(event) =>
                  setProviderForm((current) => ({ ...current, configurationData: event.target.value }))
                }
              />
            </label>
            <div className="device-provider-page__checks">
              <label className="m365-checkbox">
                <input
                  type="checkbox"
                  checked={providerForm.isEnabled}
                  disabled={!canManage}
                  onChange={(event) =>
                    setProviderForm((current) => ({ ...current, isEnabled: event.target.checked }))
                  }
                />
                <span className="m365-checkbox__label">Enabled</span>
              </label>
              <label className="m365-checkbox">
                <input
                  type="checkbox"
                  checked={providerForm.isDefault}
                  disabled={!canManage}
                  onChange={(event) =>
                    setProviderForm((current) => ({ ...current, isDefault: event.target.checked }))
                  }
                />
                <span className="m365-checkbox__label">Default</span>
              </label>
            </div>
            <div className="device-provider-page__actions">
              <button className="m365-btn m365-btn--primary" type="submit" disabled={!canManage || saving}>
                <i className="fa-light fa-floppy-disk" />
                Save
              </button>
              <button className="m365-btn m365-btn--ghost" type="button" onClick={resetProviderForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="m365-section-group">
        <div className="m365-section-group__header">
          <i className="fa-light fa-diagram-project m365-section-group__icon" />
          <h3 className="m365-section-group__title">Device mappings</h3>
        </div>
        <div className="m365-section-group__body">
          <form className="device-provider-page__mapping-form" onSubmit={saveMapping}>
            <label className="m365-field">
              Vehicle ID
              <input
                type="number"
                min="1"
                className="m365-input"
                value={mappingForm.vehicleId}
                disabled={!canManage}
                onChange={(event) =>
                  setMappingForm((current) => ({ ...current, vehicleId: event.target.value }))
                }
              />
            </label>
            <label className="m365-field">
              Provider
              <select
                className="m365-select"
                value={mappingForm.providerId}
                disabled={!canManage}
                onChange={(event) =>
                  setMappingForm((current) => ({ ...current, providerId: event.target.value }))
                }
              >
                <option value="">Select provider</option>
                {providerOptions.map((provider) => (
                  <option key={provider.providerId} value={provider.providerId}>
                    {provider.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="m365-field">
              External device ID
              <input
                className="m365-input"
                value={mappingForm.externalDeviceId}
                disabled={!canManage}
                onChange={(event) =>
                  setMappingForm((current) => ({ ...current, externalDeviceId: event.target.value }))
                }
              />
            </label>
            <label className="m365-field">
              Device IMEI
              <input
                className="m365-input"
                value={mappingForm.deviceIMEI}
                disabled={!canManage}
                onChange={(event) =>
                  setMappingForm((current) => ({ ...current, deviceIMEI: event.target.value }))
                }
              />
            </label>
            <label className="m365-field">
              Device name
              <input
                className="m365-input"
                value={mappingForm.deviceName}
                disabled={!canManage}
                onChange={(event) =>
                  setMappingForm((current) => ({ ...current, deviceName: event.target.value }))
                }
              />
            </label>
            <button className="m365-btn m365-btn--primary" type="submit" disabled={!canManage || saving}>
              <i className="fa-light fa-link" />
              Map
            </button>
          </form>

          <div className="device-provider-page__table-wrap">
            <table className="device-provider-page__table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Provider</th>
                  <th>External device</th>
                  <th>Device name</th>
                  <th>Mapped</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping) => (
                  <tr key={`${mapping.providerId}-${mapping.vehicleId}-${mapping.externalDeviceId}`}>
                    <td>
                      <strong>{mapping.vehicleName || `Vehicle ${mapping.vehicleId}`}</strong>
                      <span>{mapping.numberPlate || "No plate"}</span>
                    </td>
                    <td>{mapping.providerName}</td>
                    <td>{mapping.externalDeviceId || "Not set"}</td>
                    <td>{mapping.deviceName || mapping.deviceIMEI || "Not set"}</td>
                    <td>{formatDate(mapping.mappedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeviceProviderManagementPage;
