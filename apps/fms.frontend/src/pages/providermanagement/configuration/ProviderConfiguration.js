import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid, Popup, ScrollView } from "devextreme-react";
import { Column, Paging, SearchPanel, HeaderFilter } from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { TextArea } from "devextreme-react/text-area";
import notify from "devextreme/ui/notify";
import {
  fetchProviders,
  updateProvider,
  reloadProviders,
} from "../../../redux/actions/providerActions";

/**
 * Provider Configuration Component
 * Manage provider settings and configurations
 * Phase 7: Admin UI
 */
const ProviderConfiguration = () => {
  const dispatch = useDispatch();
  const { providers: providerList, providersLoading } = useSelector((s) => s.provider || {});
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [configPopupVisible, setConfigPopupVisible] = useState(false);
  const [configJson, setConfigJson] = useState("");

  useEffect(() => {
    dispatch(fetchProviders());
  }, [dispatch]);

  const providers = useMemo(
    () =>
      (providerList || []).map((p) => ({
        providerId: p.providerId || p.ProviderId,
        providerName: p.providerName || p.ProviderName,
        displayName: p.displayName || p.DisplayName,
        description: p.description || p.Description,
        isEnabled: (p.isEnabled ?? p.IsEnabled) ?? false,
        isDefault: (p.isDefault ?? p.IsDefault) ?? false,
        priorityOrder: p.priorityOrder ?? p.PriorityOrder ?? 0,
        configurationData: p.configurationData || p.ConfigurationData || "{}",
      })),
    [providerList]
  );

  const handleConfigureClick = (provider) => {
    setSelectedProvider(provider);
    setConfigJson(provider.configurationData || provider.ConfigurationData || "{}");
    setConfigPopupVisible(true);
  };

  const handleSaveConfiguration = async () => {
    if (!selectedProvider) return;
    try {
      // Validate JSON
      let parsed;
      try {
        parsed = JSON.parse(configJson || "{}");
      } catch (e) {
        notify("Invalid JSON format", "error", 3000);
        return;
      }

      await dispatch(
        updateProvider(selectedProvider.providerId, {
          configurationData: parsed,
        })
      );
      await dispatch(reloadProviders());
      notify("Configuration saved successfully", "success", 3000);
      setConfigPopupVisible(false);
      dispatch(fetchProviders());
    } catch (error) {
      notify("Failed to save configuration", "error", 3000);
    }
  };

  const handleToggleEnabled = async (providerId, currentStatus) => {
    try {
      await dispatch(
        updateProvider(providerId, {
          isEnabled: !currentStatus,
        })
      );
      notify(
        `Provider ${!currentStatus ? "enabled" : "disabled"} successfully`,
        "success",
        3000
      );
      dispatch(fetchProviders());
    } catch (error) {
      notify("Failed to update provider status", "error", 3000);
    }
  };

  const handleSetDefault = async (providerId) => {
    try {
      await dispatch(
        updateProvider(providerId, {
          isDefault: true,
        })
      );
      notify("Default provider updated", "success", 3000);
      dispatch(fetchProviders());
    } catch (error) {
      notify("Failed to set default provider", "error", 3000);
    }
  };

  const renderEnabledCell = (data) => {
    const isEnabled = data.data.isEnabled ?? false;
    return (
      <div className="tw-flex tw-items-center tw-justify-center">
        <Button
          stylingMode="text"
          type={isEnabled ? "default" : "normal"}
          onClick={() =>
            handleToggleEnabled(data.data.providerId, isEnabled)
          }
          text={isEnabled ? "Enabled" : "Disabled"}
        />
      </div>
    );
  };

  const renderDefaultCell = (data) => {
    const isDefault = data.data.isDefault ?? false;
    return (
      <div className="tw-flex tw-items-center tw-justify-center">
        {isDefault ? (
          <span className="tw-text-blue-600">Default</span>
        ) : (
          <Button
            stylingMode="text"
            onClick={() => handleSetDefault(data.data.providerId)}
            text="Set"
            hint="Set as default"
          />
        )}
      </div>
    );
  };

  const renderActionsCell = (data) => {
    return (
      <div className="tw-flex tw-gap-2 tw-justify-center">
        <Button
          stylingMode="text"
          onClick={() => handleConfigureClick(data.data)}
          text="Configure"
        />
      </div>
    );
  };

  if (providersLoading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
        <div className="tw-text-center">
          <p className="tw-text-2xl tw-font-semibold tw-text-blue-700">Loading…</p>
          <p className="tw-mt-2 tw-text-gray-600">Loading providers…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Provider Configuration</h2>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Manage provider settings, enable/disable providers, and configure
            API credentials
          </p>
        </div>

        <div className="tw-p-6">
          <DataGrid
            dataSource={providers}
            keyExpr="providerId"
            showBorders={true}
            rowAlternationEnabled={true}
            hoverStateEnabled={true}
            repaintChangesOnly={true}
          >
            <SearchPanel visible={true} />
            <HeaderFilter visible={true} />
            <Paging defaultPageSize={15} />

            <Column
              dataField="providerName"
              caption="Provider Name"
              width={180}
            />
            <Column
              dataField="displayName"
              caption="Display Name"
              width={200}
            />
            <Column dataField="description" caption="Description" />
            <Column
              caption="Enabled"
              width={120}
              cellRender={renderEnabledCell}
              alignment="center"
            />
            <Column
              caption="Default"
              width={100}
              cellRender={renderDefaultCell}
              alignment="center"
            />
            <Column
              dataField="priorityOrder"
              caption="Priority"
              width={80}
              alignment="center"
            />
            <Column
              caption="Actions"
              width={100}
              cellRender={renderActionsCell}
              alignment="center"
            />
          </DataGrid>
        </div>
      </div>

      {/* Configuration Popup */}
      <Popup
        visible={configPopupVisible}
        onHiding={() => setConfigPopupVisible(false)}
        dragEnabled={true}
        closeOnOutsideClick={false}
        showTitle={true}
        title={`Configure ${selectedProvider?.displayName || selectedProvider?.DisplayName || "Provider"}`}
        width={700}
        height={600}
      >
        <ScrollView width="100%" height="100%">
          <div className="tw-p-4">
            <div className="tw-mb-4">
              <h3 className="tw-font-semibold tw-text-gray-900 tw-mb-2">
                Provider Information
              </h3>
              <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm tw-bg-gray-50 tw-p-3 tw-rounded">
                <div>
                  <p className="tw-text-gray-600">Name:</p>
                  <p className="tw-font-medium">
                    {selectedProvider?.providerName || selectedProvider?.ProviderName}
                  </p>
                </div>
                <div>
                  <p className="tw-text-gray-600">Display Name:</p>
                  <p className="tw-font-medium">
                    {selectedProvider?.displayName || selectedProvider?.DisplayName}
                  </p>
                </div>
              </div>
            </div>

            <div className="tw-mb-4">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Configuration JSON
              </label>
              <p className="tw-text-xs tw-text-gray-500 tw-mb-2">
                Enter the provider configuration in JSON format. Ensure all
                required fields are included.
              </p>
              <TextArea
                value={configJson}
                onValueChanged={(e) => setConfigJson(e.value)}
                height={300}
                stylingMode="outlined"
              />
            </div>

            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-p-3 tw-mb-4">
              <h4 className="tw-text-sm tw-font-semibold tw-text-blue-900 tw-mb-2">Configuration Tips</h4>
              <ul className="tw-text-xs tw-text-blue-800 tw-space-y-1">
                <li>• Ensure JSON is properly formatted before saving</li>
                <li>
                  • Include all required configuration keys for the provider
                </li>
                <li>• API keys and sensitive data will be encrypted</li>
                <li>• Changes will reload the provider automatically</li>
              </ul>
            </div>

            <div className="tw-flex tw-gap-3 tw-justify-end">
              <Button stylingMode="text" text="Cancel" onClick={() => setConfigPopupVisible(false)} />
              <Button text="Save Configuration" onClick={handleSaveConfiguration} type="default" icon="save" />
            </div>
          </div>
        </ScrollView>
      </Popup>
    </div>
  );
};

export default ProviderConfiguration;
