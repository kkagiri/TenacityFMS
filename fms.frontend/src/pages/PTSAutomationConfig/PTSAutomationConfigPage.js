
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

  const { configurations, loading, error, pagination } = useSelector(
    (state) => state.ptsAutomationConfig
  );

  useEffect(() => {
    dispatch(fetchConfigurations());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setToastMessage(error);
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
        console.error("Error deleting configuration:", error);
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
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">
          PTS Automation Configuration
        </h2>
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
        >
          <StateStoring enabled={true} type="localStorage" storageKey="ptsAutomationConfigGrid" />
          <LoadPanel enabled={true} />
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
          <Column dataField="name" caption="Configuration Name" allowSorting={true} />
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
            dataField="duplicateCheckHours"
            caption="Duplicate Check Hours"
            width={140}
            allowSorting={true}
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
        closeOnOutsideClick={false}
        showTitle={true}
        title={showEditModal ? "Edit Configuration" : "Create Configuration"}
        width="800px"
        height="auto"
        showCloseButton={true}
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
        closeOnOutsideClick={true}
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