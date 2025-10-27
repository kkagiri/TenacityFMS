import React, { useState, useEffect } from "react";
import { DataGrid, Popup, ScrollView } from "devextreme-react";
import {
  Column,
  Editing,
  Paging,
  SearchPanel,
  HeaderFilter,
  Button as GridButton,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { TextArea } from "devextreme-react/text-area";
import axiosInstance from "../../../api/axiosInstance";
import notify from "devextreme/ui/notify";

/**
 * Provider Configuration Component
 * Manage provider settings and configurations
 * Phase 7: Admin UI
 */
const ProviderConfiguration = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [configPopupVisible, setConfigPopupVisible] = useState(false);
  const [configJson, setConfigJson] = useState("");

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/v1/providers/list");

      if (response.data.Success) {
        setProviders(response.data.Data);
      }
    } catch (error) {
      console.error("Error loading providers:", error);
      notify("Failed to load providers", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureClick = (provider) => {
    setSelectedProvider(provider);
    setConfigJson(provider.ConfigurationData || "{}");
    setConfigPopupVisible(true);
  };

  const handleSaveConfiguration = async () => {
    try {
      // Validate JSON
      JSON.parse(configJson);

      const response = await axiosInstance.put(
        `/api/v1/providers/${selectedProvider.ProviderId}`,
        {
          ConfigurationData: configJson,
        }
      );

      if (response.data.Success) {
        notify("Configuration saved successfully", "success", 3000);
        setConfigPopupVisible(false);
        loadProviders();
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        notify("Invalid JSON format", "error", 3000);
      } else {
        notify("Failed to save configuration", "error", 3000);
      }
    }
  };

  const handleToggleEnabled = async (providerId, currentStatus) => {
    try {
      const response = await axiosInstance.put(
        `/api/v1/providers/${providerId}`,
        {
          IsEnabled: !currentStatus,
        }
      );

      if (response.data.Success) {
        notify(
          `Provider ${!currentStatus ? "enabled" : "disabled"} successfully`,
          "success",
          3000
        );
        loadProviders();
      }
    } catch (error) {
      notify("Failed to update provider status", "error", 3000);
    }
  };

  const handleSetDefault = async (providerId) => {
    try {
      const response = await axiosInstance.put(
        `/api/v1/providers/${providerId}`,
        {
          IsDefault: true,
        }
      );

      if (response.data.Success) {
        notify("Default provider updated", "success", 3000);
        loadProviders();
      }
    } catch (error) {
      notify("Failed to set default provider", "error", 3000);
    }
  };

  const renderEnabledCell = (data) => {
    return (
      <div className="tw-flex tw-items-center tw-justify-center">
        <button
          onClick={() =>
            handleToggleEnabled(data.data.ProviderId, data.data.IsEnabled)
          }
          className={`tw-px-3 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
            data.data.IsEnabled
              ? "tw-bg-green-100 tw-text-green-800"
              : "tw-bg-gray-100 tw-text-gray-800"
          }`}
        >
          {data.data.IsEnabled ? (
            <>
              <i className="fa-light fa-check-circle tw-mr-1"></i>Enabled
            </>
          ) : (
            <>
              <i className="fa-light fa-circle-xmark tw-mr-1"></i>Disabled
            </>
          )}
        </button>
      </div>
    );
  };

  const renderDefaultCell = (data) => {
    return (
      <div className="tw-flex tw-items-center tw-justify-center">
        {data.data.IsDefault ? (
          <span className="tw-text-blue-600">
            <i className="fa-light fa-star tw-mr-1"></i>Default
          </span>
        ) : (
          <button
            onClick={() => handleSetDefault(data.data.ProviderId)}
            className="tw-text-gray-400 hover:tw-text-blue-600 tw-text-sm"
            title="Set as default"
          >
            <i className="fa-light fa-star"></i>
          </button>
        )}
      </div>
    );
  };

  const renderActionsCell = (data) => {
    return (
      <div className="tw-flex tw-gap-2 tw-justify-center">
        <button
          onClick={() => handleConfigureClick(data.data)}
          className="tw-text-blue-600 hover:tw-text-blue-800"
          title="Configure"
        >
          <i className="fa-light fa-gear"></i>
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
        <div className="tw-text-center">
          <i className="fa-light fa-spinner-third fa-spin tw-text-4xl tw-text-blue-600"></i>
          <p className="tw-mt-4 tw-text-gray-600">Loading providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
            <i className="fa-light fa-gear tw-mr-2"></i>
            Provider Configuration
          </h2>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Manage provider settings, enable/disable providers, and configure
            API credentials
          </p>
        </div>

        <div className="tw-p-6">
          <DataGrid
            dataSource={providers}
            keyExpr="ProviderId"
            showBorders={true}
            rowAlternationEnabled={true}
            hoverStateEnabled={true}
          >
            <SearchPanel visible={true} />
            <HeaderFilter visible={true} />
            <Paging defaultPageSize={15} />

            <Column
              dataField="ProviderName"
              caption="Provider Name"
              width={180}
            />
            <Column
              dataField="DisplayName"
              caption="Display Name"
              width={200}
            />
            <Column dataField="Description" caption="Description" />
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
              dataField="PriorityOrder"
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
        title={`Configure ${selectedProvider?.DisplayName || "Provider"}`}
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
                    {selectedProvider?.ProviderName}
                  </p>
                </div>
                <div>
                  <p className="tw-text-gray-600">Display Name:</p>
                  <p className="tw-font-medium">
                    {selectedProvider?.DisplayName}
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
              <h4 className="tw-text-sm tw-font-semibold tw-text-blue-900 tw-mb-2">
                <i className="fa-light fa-info-circle tw-mr-1"></i>
                Configuration Tips
              </h4>
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
              <Button
                text="Cancel"
                onClick={() => setConfigPopupVisible(false)}
                type="normal"
              />
              <Button
                text="Save Configuration"
                onClick={handleSaveConfiguration}
                type="default"
                icon="save"
              />
            </div>
          </div>
        </ScrollView>
      </Popup>
    </div>
  );
};

export default ProviderConfiguration;
