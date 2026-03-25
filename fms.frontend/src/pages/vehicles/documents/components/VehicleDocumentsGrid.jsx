/**
 * File: VehicleDocumentsGrid.jsx
 * Purpose: Data grid wrapper for vehicle compliance records.
 * Dependencies: DevExtreme DataGrid.
 * Last Modified: 2026-03-25
 */

import React from "react";
import DataGrid, { Column, FilterRow, Pager, Paging, SearchPanel } from "devextreme-react/data-grid";
import { formatDisplayDate } from "../VehicleDocuments.shared";

const VehicleDocumentsGrid = ({ documents, loading, onEdit, onDelete }) => {
  const renderStatusCell = ({ data }) => (
    <span className={`vehicle-documents-page__status vehicle-documents-page__status--${data.statusTone}`}>
      {data.statusLabel}
    </span>
  );

  const renderFileCell = ({ data }) => {
    if (!data.documentFileUrl) {
      return <span className="vehicle-documents-page__muted">No file</span>;
    }

    return (
      <button
        type="button"
        className="vehicle-documents-page__text-action"
        onClick={() => window.open(data.documentFileUrl, "_blank", "noopener,noreferrer")}
      >
        <i className="fa-light fa-download" />
        Open file
      </button>
    );
  };

  const renderActionCell = ({ data }) => (
    <div className="vehicle-documents-page__actions">
      <button type="button" className="vehicle-documents-page__icon-btn" onClick={() => onEdit(data)} title="Edit document">
        <i className="fa-light fa-pen" />
      </button>
      <button type="button" className="vehicle-documents-page__icon-btn vehicle-documents-page__icon-btn--danger" onClick={() => onDelete(data)} title="Delete document">
        <i className="fa-light fa-trash" />
      </button>
    </div>
  );

  return (
    <div className="vehicle-documents-page__grid-shell">
      <DataGrid
        dataSource={documents}
        keyExpr="id"
        showBorders={true}
        hoverStateEnabled={true}
        columnAutoWidth={true}
        allowColumnResizing={true}
        rowAlternationEnabled={true}
        noDataText={loading ? "Loading vehicle documents..." : "No vehicle documents match the current scope."}
      >
        <SearchPanel visible={true} width={280} placeholder="Search documents..." />
        <FilterRow visible={true} />
        <Paging defaultPageSize={10} />
        <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50]} showInfo={true} />

        <Column dataField="vehicleLabel" caption="Vehicle" minWidth={140} />
        <Column dataField="siteName" caption="Site" minWidth={120} />
        <Column dataField="vehicleTypeName" caption="Vehicle Type" minWidth={130} />
        <Column dataField="complianceCategoryName" caption="Compliance Category" minWidth={160} />
        <Column dataField="documentTypeName" caption="Document Type" minWidth={130} />
        <Column dataField="documentNumber" caption="Document Number" minWidth={140} />
        <Column dataField="issueDate" caption="Issue Date" calculateDisplayValue={(row) => formatDisplayDate(row.issueDate)} minWidth={110} />
        <Column dataField="expiryDate" caption="Expiry Date" calculateDisplayValue={(row) => formatDisplayDate(row.expiryDate)} minWidth={110} />
        <Column dataField="alertLeadDays" caption="Alert Days" width={90} alignment="right" />
        <Column dataField="daysUntilExpiry" caption="Days Left" width={90} alignment="right" />
        <Column caption="Status" cellRender={renderStatusCell} width={110} />
        <Column caption="File" cellRender={renderFileCell} width={120} />
        <Column caption="Actions" cellRender={renderActionCell} width={110} />
      </DataGrid>
    </div>
  );
};

export default VehicleDocumentsGrid;
