//Cursor - Create PTS Automation Configuration main page
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  Column,
  Paging,
  SearchPanel,
  LoadPanel,
  ColumnChooser,
  ColumnFixing,
  Selection,
  Export,
  StateStoring,
  FilterRow,
  HeaderFilter,
  Toolbar,
  Item,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { Popup } from "devextreme-react/popup";
import { Toast } from "devextreme-react/toast";
import notify from "devextreme/ui/notify";
import {
  fetchConfigurations,
  deleteConfiguration,
  clearError,
} from "../../redux/actions/ptsAutomationConfigActions";
import ConfigurationForm from "./components/ConfigurationForm";
import EffectiveConfigViewer from "./components/EffectiveConfigViewer";

//Cursor - PTS Automation Configuration page component
const PTSAutomationConfigPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEffectiveConfig, setShowEffectiveConfig] = useState(false);
  const [selectedConfiguration, setSelectedConfiguration] = useState(null);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [isLoading, setIsLoading] = useState(true);

  const { configurations, loading, error, pagination } = useSelector(
    (state) => state.ptsAutomationConfig
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await dispatch(fetchConfigurations());
      } catch (error) {
        // Error will be handled by the error effect below
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      let errorMessage = error;

      // Handle specific error cases
      if (error.includes("404") || error.includes("Not Found")) {
        errorMessage = "No configurations found or the API endpoint is not available. Please try again later.";
      } else if (error.includes("401") || error.includes("Unauthorized")) {
        errorMessage = "You are not authorized to access this resource. Please login again.";
      } else if (error.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      setToastMessage(errorMessage);
      setToastType("error");
      setToastVisible(true);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreate = () => {
    setSelectedConfiguration(null);
    setShowCreateModal(true);
  };

  const handleEdit = (configuration) => {
    setSelectedConfiguration(configuration);
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this configuration?")) {
      try {
        await dispatch(deleteConfiguration(id));
        setToastMessage("Configuration deleted successfully");
        setToastType("success");
        setToastVisible(true);
        dispatch(fetchConfigurations());
      } catch (error) {
        setToastMessage("Failed to delete configuration. Please try again.");
        setToastType("error");
        setToastVisible(true);
      }
    }
  };

  const handleViewEffectiveConfig = (siteId) => {
    setSelectedSiteId(siteId);
    setShowEffectiveConfig(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowEffectiveConfig(false);
    setSelectedConfiguration(null);
    setSelectedSiteId(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    dispatch(fetchConfigurations());
    setToastMessage("Configuration saved successfully");
    setToastType("success");
    setToastVisible(true);
  };

  const navigateToPTSDeviceSettings = () => {
    navigate("/automatic fueling");
  };

  // Column configurations
  const renderActionsColumn = ({ data }) => (
    <div className="tw-flex tw-gap-2">
      <Button
        icon="fa-light fa-edit"
        hint="Edit Configuration"
        onClick={() => handleEdit(data)}
        className="tw-btn tw-btn-sm tw-btn-primary"
      />
      <Button
        icon="fa-light fa-eye"
        hint="View Effective Config"
        onClick={() => handleViewEffectiveConfig(data.siteId)}
        className="tw-btn tw-btn-sm tw-btn-info"
        disabled={!data.siteId}
      />
      <Button
        icon="fa-light fa-trash"
        hint="Delete Configuration"
        onClick={() => handleDelete(data.id)}
        className="tw-btn tw-btn-sm tw-btn-danger"
      />
    </div>
  );

  const renderBooleanColumn = ({ value }) => (
    <i
      className={`fa-light ${
        value ? "fa-check tw-text-green-600" : "fa-times tw-text-red-600"
      }`}
    />
  );

  return (
    <div className="content-block">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">

        <div className="tw-flex tw-gap-3">
          <Button
            text="PTS Device Settings"
            icon="fa-light fa-cog"
            type="default"
            onClick={navigateToPTSDeviceSettings}
            className="tw-btn tw-btn-outline"
          />
          <Button
            text="Create Configuration"
            icon="fa-light fa-plus"
            type="success"
            onClick={handleCreate}
            className="tw-btn tw-btn-success"
          />
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-lg tw-shadow-md">
        <DataGrid
          dataSource={configurations}
          showBorders={true}
          remoteOperations={false}
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          className="tw-w-full"
          noDataText="No configurations found. Create a new configuration to get started."
        >
          <StateStoring enabled={true} type="localStorage" storageKey="ptsAutomationConfigGrid" />
          <LoadPanel enabled={isLoading} />
          <Selection mode="single" />
          <Export enabled={true} />
          <ColumnChooser enabled={true} />
          <ColumnFixing enabled={true} />
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <SearchPanel visible={true} width={240} placeholder="Search configurations..." />
          <Paging defaultPageSize={10} pageSizes={[5, 10, 20, 50]} />

          <Toolbar>
            <Item name="addRowButton" />
            <Item name="exportButton" />
            <Item name="columnChooserButton" />
            <Item name="searchPanel" />
          </Toolbar>

          <Column dataField="id" caption="ID" width={80} allowSorting={true} />
          <Column
            dataField="name"
            caption="Configuration Name"
            allowSorting={true}
          />
          <Column dataField="siteId" caption="Site ID" width={100} allowSorting={true} />
          <Column
            dataField="isGlobal"
            caption="Global"
            width={80}
            allowSorting={true}
            cellRender={renderBooleanColumn}
          />
          <Column
            dataField="autoCreateLedgerEntries"
            caption="Auto Ledger"
            width={100}
            allowSorting={true}
            cellRender={renderBooleanColumn}
          />
          <Column
            dataField="checkForDuplicateManualEntries"
            caption="Check Duplicates"
            width={120}
            allowSorting={true}
            cellRender={renderBooleanColumn}
          />
          <Column
            dataField="reconciliationFrequencyMinutes"
            caption="Reconciliation Freq (min)"
            width={140}
            allowSorting={true}
          />
          <Column
            dataField="updateTankVolumeFromBookKeeping"
            caption="Use BookKeeping"
            width={120}
            allowSorting={true}
            cellRender={renderBooleanColumn}
          />
          <Column
            dataField="usePtsProbeReadings"
            caption="Use PTS Probe"
            width={120}
            allowSorting={true}
            cellRender={renderBooleanColumn}
          />
          <Column
            dataField="volumeSourcePriorityText"
            caption="Volume Priority"
            width={120}
            allowSorting={true}
          />
          <Column
            dataField="autoReconcileTankVolumes"
            caption="Auto Reconcile"
            width={120}
            allowSorting={true}
            cellRender={renderBooleanColumn}
          />
          <Column
            dataField="discrepancyActionText"
            caption="Discrepancy Action"
            width={130}
            allowSorting={true}
          />
          <Column
            dataField="maxVolumeDiscrepancyThreshold"
            caption="Max Discrepancy"
            width={120}
            allowSorting={true}
            format="###0.00"
          />
          <Column
            dataField="isActive"
            caption="Active"
            width={80}
            allowSorting={true}
            cellRender={renderBooleanColumn}
          />
          <Column
            caption="Actions"
            width={150}
            allowSorting={false}
            cellRender={renderActionsColumn}
          />
        </DataGrid>
      </div>

      {/* Create/Edit Configuration Modal */}
      <Popup
        visible={showCreateModal || showEditModal}
        onHiding={handleModalClose}
        dragEnabled={false}
        showCloseButton
={false}
        showTitle={false}
        width="900px"
        height="90vh"
        showCloseButton={false}
        className="pts-config-popup"
      >
        <ConfigurationForm
          configuration={selectedConfiguration}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Popup>

      {/* Effective Configuration Viewer Modal */}
      <Popup
        visible={showEffectiveConfig}
        onHiding={handleModalClose}
        dragEnabled={false}
        showCloseButton
={true}
        showTitle={true}
        title="Effective Configuration for Site"
        width="600px"
        height="auto"
        showCloseButton={true}
      >
        <EffectiveConfigViewer
          siteId={selectedSiteId}
          onClose={handleModalClose}
        />
      </Popup>

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHiding={() => setToastVisible(false)}
        displayTime={3000}
      />
    </div>
  );
};

export default PTSAutomationConfigPage;