/**
 * File: VehicleDocumentsGrid.jsx
 * Purpose: Data grid wrapper for vehicle compliance records.
 * Dependencies: DevExtreme DataGrid, ExcelJS, file-saver.
 * Last Modified: 2026-03-25
 */

import React, { useCallback, useRef } from "react";
import DataGrid, { Column, Export, FilterRow, Item as ToolbarItem, Pager, Paging, SearchPanel, Toolbar } from "devextreme-react/data-grid";
import { Workbook } from "exceljs";
import saveAs from "file-saver";
import { exportDataGrid } from "devextreme/excel_exporter";
import { formatDisplayDate } from "../VehicleDocuments.shared";

const VehicleDocumentsGrid = ({ documents, loading, onEdit, onDelete, canEdit, canDelete }) => {
  const dataGridRef = useRef(null);

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
      {canEdit && onEdit && (
        <button type="button" className="vehicle-documents-page__icon-btn" onClick={() => onEdit(data)} title="Edit document">
          <i className="fa-light fa-pen" />
        </button>
      )}
      {canDelete && onDelete && (
        <button type="button" className="vehicle-documents-page__icon-btn vehicle-documents-page__icon-btn--danger" onClick={() => onDelete(data)} title="Delete document">
          <i className="fa-light fa-trash" />
        </button>
      )}
    </div>
  );

  const handleExporting = useCallback((event) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Vehicle Documents");

    exportDataGrid({
      component: event.component,
      worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === "header") {
          excelCell.font = { bold: true, color: { argb: "FF201F1E" } };
          excelCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEAF3FB" },
          };
        }
      },
    }).then(() => workbook.xlsx.writeBuffer())
      .then((buffer) => {
        saveAs(new Blob([buffer], { type: "application/octet-stream" }), "VehicleDocuments.xlsx");
      });

    event.cancel = true;
  }, []);

  return (
    <div className="vehicle-documents-page__grid-shell">
      <DataGrid
        ref={dataGridRef}
        dataSource={documents}
        keyExpr="id"
        showBorders={true}
        hoverStateEnabled={true}
        columnAutoWidth={true}
        allowColumnResizing={true}
        rowAlternationEnabled={true}
        noDataText={loading ? "Loading vehicle documents..." : "No vehicle documents match the current scope."}
        onExporting={handleExporting}
      >
        <Export enabled={true} formats={["xlsx"]} allowExportSelectedData={false} />
        <Toolbar>
          <ToolbarItem name="searchPanel" location="before" />
          <ToolbarItem name="exportButton" location="after" />
        </Toolbar>
        <SearchPanel visible={true} width={280} placeholder="Search documents..." />
        <FilterRow visible={true} />
        <Paging defaultPageSize={10} />
        <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50, 100]} showInfo={true} />

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
