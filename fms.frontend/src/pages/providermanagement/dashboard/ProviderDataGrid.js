import React from "react";
import { DataGrid } from "devextreme-react";
import {
  Column,
  Paging,
  SearchPanel,
  HeaderFilter,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";

/**
 * Provider Data Grid Component
 * Isolated DataGrid for provider management to avoid React DOM issues
 */
const ProviderDataGrid = ({ providers, healthData, onTestConnection }) => {
  const getStatusBadge = (status) => {
    const badges = {
      Healthy: "tw-bg-green-100 tw-text-green-800",
      Degraded: "tw-bg-yellow-100 tw-text-yellow-800",
      Unhealthy: "tw-bg-red-100 tw-text-red-800",
    };

    return (
      <span
        className={`tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${
          badges[status] || badges.Unhealthy
        }`}
      >
        <span className="tw-mr-1" aria-hidden>
          {status === "Healthy" ? "✔" : status === "Degraded" ? "!" : "✖"}
        </span>
        <span>{status}</span>
      </span>
    );
  };

  const renderProviderStatus = (cellData) => {
    const providerName = cellData.data.providerName;
    const health = healthData.find(
      (h) => (h.providerName || h.ProviderName) === providerName
    );

    if (!health) {
      console.warn(`No health data found for provider: ${providerName}. Available providers:`, healthData.map(h => h.providerName || h.ProviderName));
      return <span className="tw-text-gray-400">Unknown</span>;
    }

    const status = health.status || health.Status;
    return getStatusBadge(status);
  };

  const renderEnabledStatus = (cellData) => {
    return cellData.data.isEnabled ? (
      <span className="tw-text-green-600">Enabled</span>
    ) : (
      <span className="tw-text-gray-400">Disabled</span>
    );
  };

  const renderDefaultStatus = (cellData) => {
    return cellData.data.isDefault ? (
      <span className="tw-text-blue-600">Default</span>
    ) : (
      <span className="tw-text-gray-400">-</span>
    );
  };

  const renderResponseTime = (cellData) => {
    const providerName = cellData.data.providerName;
    const health = healthData.find(
      (h) => (h.providerName || h.ProviderName) === providerName
    );
    if (!health) {
      return <span className="tw-text-gray-400">-</span>;
    }

    const time = health.responseTimeMs || health.ResponseTimeMs || 0;
    const color =
      time < 100
        ? "tw-text-green-600"
        : time < 500
        ? "tw-text-yellow-600"
        : "tw-text-red-600";

    return <span className={color}>{time}ms</span>;
  };

  const renderActions = (cellData) => {
    return (
      <div className="tw-flex tw-gap-2 tw-justify-center">
        <Button
          stylingMode="text"
          onClick={() => onTestConnection(cellData.data.providerName)}
          text="Test"
          hint="Test Connection"
        />
      </div>
    );
  };

  return (
    <DataGrid
      dataSource={providers}
      keyExpr="providerId"
      showBorders={true}
      rowAlternationEnabled={true}
      hoverStateEnabled={true}
      repaintChangesOnly={true}
      noDataText="No providers configured"
    >
      <SearchPanel visible={true} placeholder="Search providers..." />
      <HeaderFilter visible={true} />
      <Paging defaultPageSize={10} />

      <Column
        dataField="providerName"
        caption="Provider Name"
        width={200}
      />

      <Column
        dataField="displayName"
        caption="Display Name"
        width={200}
      />

      <Column
        caption="Status"
        width={120}
        cellRender={renderProviderStatus}
        alignment="center"
      />

      <Column
        caption="Enabled"
        width={100}
        cellRender={renderEnabledStatus}
        alignment="center"
      />

      <Column
        caption="Default"
        width={100}
        cellRender={renderDefaultStatus}
        alignment="center"
      />

      <Column
        caption="Response Time"
        width={130}
        cellRender={renderResponseTime}
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
        cellRender={renderActions}
        alignment="center"
        allowSorting={false}
      />
    </DataGrid>
  );
};

export default ProviderDataGrid;
