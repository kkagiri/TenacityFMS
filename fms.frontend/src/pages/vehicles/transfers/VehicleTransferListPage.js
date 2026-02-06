/**
 * Page to display all vehicle transfers with filtering and search
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import DataGrid, {
  Column,
  Selection,
  SearchPanel,
  HeaderFilter,
  FilterRow,
  Paging,
  Pager,
  Export,
  ColumnChooser,
  LoadPanel,
  Sorting,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { Popup } from "devextreme-react/popup";
import { SelectBox } from "devextreme-react/select-box";
import { DateBox } from "devextreme-react/date-box";
import notify from "devextreme/ui/notify";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import axiosInstance from "../../../api/axiosInstance";
import VehicleTransferForm from "./VehicleTransferForm";
import VehicleTransferDetails from "./VehicleTransferDetails";
import "./VehicleTransferListPage.scss";

const VehicleTransferListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const sites = useSelector((state) => state.site.sites);

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showTransferDetails, setShowTransferDetails] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Filter states
  const [filterSiteId, setFilterSiteId] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterDateFrom, setFilterDateFrom] = useState(null);
  const [filterDateTo, setFilterDateTo] = useState(null);

  const statusOptions = [
    { value: null, text: "All Statuses" },
    { value: "Pending", text: "Pending" },
    { value: "InTransit", text: "In Transit" },
    { value: "Completed", text: "Completed" },
    { value: "Cancelled", text: "Cancelled" },
  ];

  useEffect(() => {
    dispatch(fetchSiteList());
    loadTransfers();
  }, [dispatch]);

  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterSiteId) params.append("siteId", filterSiteId);
      if (filterStatus) params.append("status", filterStatus);
      if (filterDateFrom) params.append("fromDate", filterDateFrom.toISOString());
      if (filterDateTo) params.append("toDate", filterDateTo.toISOString());

      const response = await axiosInstance.get(`/vehicletransfers?${params.toString()}`);
      if (response.data?.isSuccess) {
        setTransfers(response.data.data || []);
      } else {
        setTransfers([]);
      }
    } catch (error) {
      console.error("Error loading transfers:", error);
      notify("Failed to load transfers", "error", 3000);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [filterSiteId, filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadTransfers();
  }, [filterSiteId, filterStatus, filterDateFrom, filterDateTo, loadTransfers]);

  const handleRefresh = () => {
    loadTransfers();
  };

  const handleNewTransfer = () => {
    setSelectedVehicleId(null);
    setShowTransferForm(true);
  };

  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer);
    setShowTransferDetails(true);
  };

  const handleTransferSuccess = () => {
    setShowTransferForm(false);
    notify("Transfer created successfully", "success", 3000);
    loadTransfers();
  };

  const handleExport = () => {
    const workbook = dataGridRef.current?.instance?.exportToExcel?.();
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "tw-bg-green-100 tw-text-green-800";
      case "intransit":
        return "tw-bg-blue-100 tw-text-blue-800";
      case "pending":
        return "tw-bg-yellow-100 tw-text-yellow-800";
      case "cancelled":
        return "tw-bg-red-100 tw-text-red-800";
      default:
        return "tw-bg-gray-100 tw-text-gray-800";
    }
  };

  const statusCellRender = (cellData) => {
    const status = cellData.value;
    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getStatusBadgeClass(status)}`}>
        {status}
      </span>
    );
  };

  const dateCellRender = (cellData) => {
    if (!cellData.value) return "-";
    return new Date(cellData.value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const actionsCellRender = (cellData) => {
    return (
      <div className="tw-flex tw-gap-2">
        <Button
          icon="fa-light fa-eye"
          hint="View Details"
          stylingMode="text"
          type="default"
          onClick={() => handleViewDetails(cellData.data)}
        />
        <Button
          icon="fa-light fa-file-pdf"
          hint="Download PDF"
          stylingMode="text"
          type="default"
          onClick={() => handleDownloadPdf(cellData.data)}
          disabled={!cellData.data.documentUrl}
        />
      </div>
    );
  };

  const handleDownloadPdf = async (transfer) => {
    if (transfer.documentUrl) {
      window.open(transfer.documentUrl, "_blank");
    } else {
      notify("No document available for this transfer", "warning", 3000);
    }
  };

  return (
    <div className="vehicle-transfer-list-page tw-h-full tw-flex tw-flex-col">
      {/* Header */}
      <div className="tw-bg-white tw-p-4 tw-border-b tw-border-gray-200 tw-rounded-t-lg tw-shadow-sm tw-mb-4">
        <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-justify-between lg:tw-items-center tw-gap-4">
          <div className="tw-flex-shrink-0">
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-truck-arrow-right tw-mr-2 tw-text-blue-600"></i>
              Vehicle Transfers
            </h2>
            <p className="tw-text-gray-600 tw-text-sm tw-mt-1">
              View and manage vehicle transfer checkup reports
            </p>
          </div>
          <div className="tw-flex tw-flex-wrap tw-gap-3 tw-items-center">
            <Button
              text="Refresh"
              icon="fa-light fa-refresh"
              type="default"
              stylingMode="outlined"
              onClick={handleRefresh}
            />
            <Button
              text="New Transfer"
              icon="fa-light fa-plus"
              type="default"
              stylingMode="contained"
              onClick={handleNewTransfer}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tw-bg-white tw-p-4 tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-sm tw-mb-4">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-5 tw-gap-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Site
            </label>
            <SelectBox
              dataSource={[{ id: null, name: "All Sites" }, ...(sites || [])]}
              value={filterSiteId}
              valueExpr="id"
              displayExpr="name"
              onValueChanged={(e) => setFilterSiteId(e.value)}
              placeholder="Filter by site"
              showClearButton
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Status
            </label>
            <SelectBox
              dataSource={statusOptions}
              value={filterStatus}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => setFilterStatus(e.value)}
              placeholder="Filter by status"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              From Date
            </label>
            <DateBox
              value={filterDateFrom}
              onValueChanged={(e) => setFilterDateFrom(e.value)}
              placeholder="From date"
              showClearButton
              type="date"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              To Date
            </label>
            <DateBox
              value={filterDateTo}
              onValueChanged={(e) => setFilterDateTo(e.value)}
              placeholder="To date"
              showClearButton
              type="date"
            />
          </div>
          <div className="tw-flex tw-items-end">
            <Button
              text="Clear Filters"
              icon="fa-light fa-times"
              type="normal"
              stylingMode="text"
              onClick={() => {
                setFilterSiteId(null);
                setFilterStatus(null);
                setFilterDateFrom(null);
                setFilterDateTo(null);
              }}
            />
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm tw-overflow-hidden">
        <DataGrid
          ref={dataGridRef}
          dataSource={transfers}
          keyExpr="transferId"
          showBorders={false}
          showRowLines={true}
          columnAutoWidth={true}
          wordWrapEnabled={true}
          height="100%"
          hoverStateEnabled={true}
          rowAlternationEnabled={true}
          onRowDblClick={(e) => handleViewDetails(e.data)}
        >
          <LoadPanel enabled={loading} />
          <Selection mode="single" />
          <SearchPanel visible={true} width={250} placeholder="Search transfers..." />
          <HeaderFilter visible={true} />
          <FilterRow visible={true} />
          <Sorting mode="multiple" />
          <Paging defaultPageSize={20} />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={[10, 20, 50, 100]}
            showInfo={true}
            showNavigationButtons={true}
          />
          <ColumnChooser enabled={true} mode="select" />
          <Export enabled={true} allowExportSelectedData={false} />

          <Column dataField="transferId" caption="ID" width={70} />
          <Column dataField="vehicleHyoungNo" caption="Vehicle No" width={120} />
          <Column dataField="vehicleNumberPlate" caption="Reg. No" width={120} />
          <Column dataField="makeModel" caption="Make/Model" width={150} />
          <Column dataField="fromSiteName" caption="From Site" width={150} />
          <Column dataField="toSiteName" caption="To Site" width={150} />
          <Column
            dataField="transferDate"
            caption="Transfer Date"
            width={120}
            cellRender={dateCellRender}
            dataType="date"
          />
          <Column dataField="driverName" caption="Driver" width={150} />
          <Column dataField="currentReading" caption="Reading" width={100} />
          <Column dataField="readingUnit" caption="Unit" width={60} />
          <Column
            dataField="status"
            caption="Status"
            width={110}
            cellRender={statusCellRender}
          />
          <Column dataField="deliveryNoteNumber" caption="Delivery Note" width={120} />
          <Column
            caption="Actions"
            width={100}
            fixed={true}
            fixedPosition="right"
            cellRender={actionsCellRender}
            allowFiltering={false}
            allowSorting={false}
          />
        </DataGrid>
      </div>

      {/* New Transfer Popup */}
      <Popup
        visible={showTransferForm}
        onHiding={() => setShowTransferForm(false)}
        title="Create Vehicle Transfer"
        width="90%"
        height="90%"
        showCloseButton={true}
        dragEnabled={true}
      >
        <VehicleTransferForm
          vehicleId={selectedVehicleId}
          onClose={() => setShowTransferForm(false)}
          onSuccess={handleTransferSuccess}
        />
      </Popup>

      {/* Transfer Details Popup */}
      <Popup
        visible={showTransferDetails}
        onHiding={() => setShowTransferDetails(false)}
        title={`Transfer Details - ${selectedTransfer?.vehicleHyoungNo || ""}`}
        width="90%"
        height="90%"
        showCloseButton={true}
        dragEnabled={true}
      >
        {selectedTransfer && (
          <VehicleTransferDetails
            transferId={selectedTransfer.transferId}
            onClose={() => setShowTransferDetails(false)}
          />
        )}
      </Popup>
    </div>
  );
};

export default VehicleTransferListPage;
