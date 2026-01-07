//Cursor - Create PTS Automation Configuration main page
import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import notify from "devextreme/ui/notify";
import {
  fetchConfigurations,
  deleteConfiguration,
  clearError,
} from "../../redux/actions/ptsAutomationConfigActions";
import ConfigurationForm from "./components/ConfigurationForm";
import EffectiveConfigViewer from "./components/EffectiveConfigViewer";

// Helper function to show notifications
const showNotification = (message, type = "success") => {
  notify({
    message,
    type,
    displayTime: 3000,
    position: { at: "top right", my: "top right", offset: "0 20" },
  });
};

//Cursor - PTS Automation Configuration page component
const PTSAutomationConfigPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEffectiveConfig, setShowEffectiveConfig] = useState(false);
  const [selectedConfiguration, setSelectedConfiguration] = useState(null);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
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
        errorMessage =
          "No configurations found or the API endpoint is not available. Please try again later.";
      } else if (error.includes("401") || error.includes("Unauthorized")) {
        errorMessage =
          "You are not authorized to access this resource. Please login again.";
      } else if (error.includes("Network Error")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      showNotification(errorMessage, "error");
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
        showNotification("Configuration deleted successfully", "success");
        dispatch(fetchConfigurations());
      } catch (error) {
        showNotification(
          "Failed to delete configuration. Please try again.",
          "error"
        );
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
    showNotification("Configuration saved successfully", "success");
  };

  const navigateToPTSDeviceSettings = () => {
    navigate("/automatic fueling");
  };

  // Memoize the configurations to prevent unnecessary re-renders
  const gridDataSource = useMemo(() => {
    // Handle various response shapes: array, object with data property, or null/undefined
    if (Array.isArray(configurations)) {
      return [...configurations];
    }
    if (configurations && Array.isArray(configurations.data)) {
      return [...configurations.data];
    }
    return [];
  }, [configurations]);

  // Stable callback for actions column - avoid inline functions in cellRender
  const handleEditClick = useCallback((e) => {
    const data = e.row?.data;
    if (data) {
      setSelectedConfiguration(data);
      setShowEditModal(true);
    }
  }, []);

  const handleViewClick = useCallback((e) => {
    const data = e.row?.data;
    if (data?.siteId) {
      setSelectedSiteId(data.siteId);
      setShowEffectiveConfig(true);
    }
  }, []);

  const handleDeleteClick = useCallback(
    async (e) => {
      const data = e.row?.data;
      if (
        data &&
        window.confirm("Are you sure you want to delete this configuration?")
      ) {
        try {
          await dispatch(deleteConfiguration(data.id));
          showNotification("Configuration deleted successfully", "success");
          dispatch(fetchConfigurations());
        } catch (error) {
          showNotification(
            "Failed to delete configuration. Please try again.",
            "error"
          );
        }
      }
    },
    [dispatch]
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
          dataSource={gridDataSource}
          showBorders={true}
          remoteOperations={false}
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          className="tw-w-full"
          noDataText="No configurations found. Create a new configuration to get started."
          repaintChangesOnly={true}
          keyExpr="id"
        >
          <StateStoring
            enabled={true}
            type="localStorage"
            storageKey="ptsAutomationConfigGrid"
          />
          <LoadPanel enabled={isLoading} />
          <Selection mode="single" />
          <Export enabled={true} />
          <ColumnChooser enabled={true} />
          <ColumnFixing enabled={true} />
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <SearchPanel
            visible={true}
            width={240}
            placeholder="Search configurations..."
          />
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
          <Column
            dataField="siteId"
            caption="Site ID"
            width={100}
            allowSorting={true}
          />
          <Column
            dataField="isGlobal"
            caption="Global"
            width={80}
            allowSorting={true}
            dataType="boolean"
          />
          <Column
            dataField="autoCreateLedgerEntries"
            caption="Auto Ledger"
            width={100}
            allowSorting={true}
            dataType="boolean"
          />
          <Column
            dataField="checkForDuplicateManualEntries"
            caption="Check Duplicates"
            width={120}
            allowSorting={true}
            dataType="boolean"
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
            dataType="boolean"
          />
          <Column
            dataField="usePtsProbeReadings"
            caption="Use PTS Probe"
            width={120}
            allowSorting={true}
            dataType="boolean"
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
            dataType="boolean"
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
            dataType="boolean"
          />
          <Column
            type="buttons"
            caption="Actions"
            width={150}
            buttons={[
              {
                hint: "Edit",
                icon: "edit",
                onClick: handleEditClick,
              },
              {
                hint: "View Effective Config",
                icon: "eyeopen",
                onClick: handleViewClick,
              },
              {
                hint: "Delete",
                icon: "trash",
                onClick: handleDeleteClick,
              },
            ]}
          />
        </DataGrid>
      </div>

      {/* Create Configuration Modal */}
      {showCreateModal && (
        <Popup
          visible={true}
          onHiding={handleModalClose}
          dragEnabled={false}
          showCloseButton={false}
          showTitle={false}
          width="900px"
          height="90vh"
          className="pts-config-popup"
          contentRender={() => (
            <ConfigurationForm
              configuration={null}
              onSuccess={handleFormSuccess}
              onCancel={handleModalClose}
            />
          )}
        />
      )}

      {/* Edit Configuration Modal */}
      {showEditModal && (
        <Popup
          visible={true}
          onHiding={handleModalClose}
          dragEnabled={false}
          showCloseButton={false}
          showTitle={false}
          width="900px"
          height="90vh"
          className="pts-config-popup"
          contentRender={() => (
            <ConfigurationForm
              configuration={selectedConfiguration}
              onSuccess={handleFormSuccess}
              onCancel={handleModalClose}
            />
          )}
        />
      )}

      {/* Effective Configuration Viewer Modal */}
      {showEffectiveConfig && (
        <Popup
          visible={true}
          onHiding={handleModalClose}
          dragEnabled={false}
          showCloseButton={true}
          showTitle={true}
          title="Effective Configuration for Site"
          width="600px"
          height="auto"
          contentRender={() => (
            <EffectiveConfigViewer
              siteId={selectedSiteId}
              onClose={handleModalClose}
            />
          )}
        />
      )}
    </div>
  );
};

export default PTSAutomationConfigPage;
