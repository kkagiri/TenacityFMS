import React, { useState, useEffect, useCallback } from "react";
import { DataGrid } from "devextreme-react/data-grid";
import {
  Column,
  Paging,
  FilterRow,
  SearchPanel,
  Export,
  Selection,
  LoadPanel,
} from "devextreme-react/data-grid";
import Button from "devextreme-react/button";
import { Popup, ScrollView } from "devextreme-react";
import {
  Form,
  SimpleItem,
  Label,
  RequiredRule,
  GroupItem,
} from "devextreme-react/form";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";

const VehicleMaintenanceHistory = ({ vehicleId }) => {
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState({});
  const [loadingGpsData, setLoadingGpsData] = useState(false);

  // Maintenance types - aligned with MaintenanceList
  const maintenanceTypes = [
    "Oil Change",
    "Tire Rotation",
    "Brake Service",
    "Engine Service",
    "Transmission Service",
    "Battery Replacement",
    "Air Filter Replacement",
    "Spark Plug Replacement",
    "Coolant Service",
    "Inspection",
    "General Repair",
    "Other",
  ];

  const loadMaintenanceHistory = useCallback(async () => {
    if (!vehicleId) return;

    try {
      setIsLoading(true);

      // Call the real API endpoint
      const response = await axiosInstance.get(
        `/VehicleMaintenance?vehicleId=${vehicleId}`
      );

      if (response.status === 200) {
        const data = response.data;

        // Process the data
        const processedData = (data || []).map((item) => ({
          ...item,
          scheduledDate: item.scheduledDate
            ? new Date(item.scheduledDate)
            : null,
          completedDate: item.completedDate
            ? new Date(item.completedDate)
            : null,
          dateCreated: item.dateCreated ? new Date(item.dateCreated) : null,
        }));

        setMaintenanceData(processedData);
      } else {
        throw new Error("Failed to load maintenance history");
      }
    } catch (error) {
      console.error("Error loading maintenance history:", error);
      notify(
        error.message || "Failed to load maintenance history",
        "error",
        3000
      );
      setMaintenanceData([]);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadMaintenanceHistory();
  }, [loadMaintenanceHistory]);

  const handleAddMaintenance = () => {
    if (!vehicleId) {
      notify(
        "Vehicle context missing. Please open from a specific vehicle.",
        "warning",
        3000
      );
      return;
    }

    setFormData({
      vehicleId: vehicleId,
      maintenanceType: "",
      status: "Scheduled",
      scheduledDate: new Date(),
      priority: 2,
      notes: "",
      issueNote: "",
      description: "",
      odometerAtSchedule: null,
    });
    setShowPopup(true);
  };

  // Fetch odometer reading from GPS
  const handleFetchOdometerFromGPS = async () => {
    if (!formData.vehicleId) {
      notify("Please select a vehicle first", "warning", 3000);
      return;
    }

    try {
      setLoadingGpsData(true);
      const response = await axiosInstance.get(
        `/tracking/vehicles/${formData.vehicleId}/location`
      );

      if (response.status === 200) {
        const locationData = response.data;

        if (
          locationData &&
          locationData.odometer !== null &&
          locationData.odometer !== undefined
        ) {
          setFormData((prev) => ({
            ...prev,
            odometerAtSchedule: locationData.odometer,
          }));
          notify(
            `Odometer reading updated: ${locationData.odometer} km`,
            "success",
            3000
          );
        } else {
          notify("Odometer data not available from GPS", "warning", 3000);
        }
      } else {
        notify("Failed to fetch GPS data", "error", 3000);
      }
    } catch (error) {
      console.error("Error fetching GPS data:", error);
      notify("Error fetching odometer from GPS", "error", 3000);
    } finally {
      setLoadingGpsData(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await axiosInstance.post(
        "/VehicleMaintenance",
        formData
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(
          response.data?.message || "Failed to create maintenance record"
        );
      }

      notify("Maintenance record created successfully", "success", 3000);
      setShowPopup(false);
      // Refresh history
      loadMaintenanceHistory();
    } catch (error) {
      console.error("Error saving maintenance record:", error);
      notify(error.message || "Error saving maintenance record", "error", 3000);
    }
  };

  // Removed unused formatCurrency and formatDate helpers (were not used in this component)

  const getStatusColor = (status) => {
    const colors = {
      Scheduled: "tw-bg-blue-100 tw-text-blue-800",
      "In Progress": "tw-bg-yellow-100 tw-text-yellow-800",
      Completed: "tw-bg-green-100 tw-text-green-800",
      Cancelled: "tw-bg-red-100 tw-text-red-800",
    };
    return colors[status] || "tw-bg-gray-100 tw-text-gray-800";
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      1: "Low",
      2: "Normal",
      3: "Medium",
      4: "High",
      5: "Critical",
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      1: "tw-text-gray-600",
      2: "tw-text-blue-600",
      3: "tw-text-yellow-600",
      4: "tw-text-orange-600",
      5: "tw-text-red-600",
    };
    return colors[priority] || "tw-text-gray-600";
  };

  return (
    <div className="vehicle-maintenance-history">
      <div className="tw-mb-6">
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-justify-between md:tw-items-center tw-mb-4">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 md:tw-mb-0">
            Maintenance History
          </h3>
          <Button
            text="Add Maintenance"
            icon="fa-light fa-plus"
            onClick={handleAddMaintenance}
            type="default"
            stylingMode="contained"
            disabled={!vehicleId}
          />
        </div>
      </div>

      {/* Data Grid */}
      <DataGrid
        dataSource={maintenanceData}
        keyExpr="maintenanceId"
        showBorders={true}
        showRowLines={true}
        showColumnLines={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        height={500}
      >
        <LoadPanel enabled={isLoading} />

        <Column
          dataField="scheduledDate"
          caption="Scheduled Date"
          dataType="date"
          format="dd/MM/yyyy"
          width={120}
          allowSorting={true}
        />

        <Column dataField="maintenanceType" caption="Type" width={150} />

        <Column dataField="description" caption="Description" width={200} />

        <Column
          dataField="priority"
          caption="Priority"
          width={100}
          cellRender={(cellData) => (
            <span
              className={`tw-font-medium ${getPriorityColor(cellData.value)}`}
            >
              {getPriorityLabel(cellData.value)}
            </span>
          )}
        />

        <Column
          dataField="status"
          caption="Status"
          width={120}
          cellRender={(cellData) => (
            <span
              className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getStatusColor(
                cellData.value
              )}`}
            >
              {cellData.value}
            </span>
          )}
        />

        <Column dataField="notes" caption="Notes" width={200} />

        <Column dataField="issueNote" caption="Issue Notes" width={200} />

        <Column
          dataField="completedDate"
          caption="Completed Date"
          dataType="date"
          format="dd/MM/yyyy"
          width={130}
        />

        <Column
          dataField="odometerAtSchedule"
          caption="Odometer (KM)"
          dataType="number"
          width={120}
          format="#,##0"
        />

        <Paging enabled={true} pageSize={20} />
        <FilterRow visible={true} />
        <SearchPanel
          visible={true}
          width={240}
          placeholder="Search maintenance records..."
        />
        <Export enabled={true} fileName="vehicle-maintenance-history" />
        <Selection mode="single" />
      </DataGrid>

      {/* Add Maintenance Popup */}
      <Popup
        visible={showPopup}
        onHiding={() => setShowPopup(false)}
        title={"Add Maintenance Record"}
        width="95%"
        height="95%"
        maxWidth={1200}
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        <ScrollView width="100%" height="100%">
          <div className="tw-p-4">
            <Form
              formData={formData}
              onFieldDataChanged={(e) =>
                setFormData({ ...formData, [e.dataField]: e.value })
              }
              labelLocation="top"
              colCount={1}
            >
              <GroupItem caption="Vehicle Information" colSpan={1}>
                <SimpleItem
                  dataField="vehicleId"
                  editorType="dxTextBox"
                  editorOptions={{
                    readOnly: true,
                  }}
                >
                  <Label text="Vehicle ID" />
                  <RequiredRule message="Vehicle is required" />
                </SimpleItem>

                <SimpleItem
                  dataField="maintenanceType"
                  editorType="dxSelectBox"
                  editorOptions={{
                    dataSource: maintenanceTypes,
                    searchEnabled: true,
                    placeholder: "Select maintenance type",
                    showClearButton: true,
                  }}
                >
                  <Label text="Maintenance Type" />
                  <RequiredRule message="Maintenance type is required" />
                </SimpleItem>
              </GroupItem>

              <GroupItem caption="Scheduling" colSpan={1}>
                <SimpleItem
                  dataField="status"
                  editorType="dxSelectBox"
                  editorOptions={{
                    items: [
                      "Scheduled",
                      "In Progress",
                      "Completed",
                      "Cancelled",
                    ],
                  }}
                >
                  <Label text="Status" />
                </SimpleItem>

                <SimpleItem dataField="scheduledDate" editorType="dxDateBox">
                  <Label text="Scheduled Date" />
                </SimpleItem>

                <SimpleItem
                  dataField="priority"
                  editorType="dxSelectBox"
                  editorOptions={{
                    items: [
                      { value: 1, text: "Low" },
                      { value: 2, text: "Normal" },
                      { value: 3, text: "Medium" },
                      { value: 4, text: "High" },
                      { value: 5, text: "Critical" },
                    ],
                    displayExpr: "text",
                    valueExpr: "value",
                  }}
                >
                  <Label text="Priority" />
                </SimpleItem>
              </GroupItem>

              <GroupItem caption="Odometer Reading" colSpan={1}>
                <div className="tw-mb-2">
                  <Button
                    text="Pull Odometer from GPS"
                    icon="download"
                    type="default"
                    onClick={handleFetchOdometerFromGPS}
                    disabled={!formData.vehicleId || loadingGpsData}
                    hint="Fetch current odometer reading from GPS tracking"
                  />
                  {loadingGpsData && (
                    <span className="tw-ml-2 tw-text-sm tw-text-gray-600">
                      Loading...
                    </span>
                  )}
                </div>

                <SimpleItem
                  dataField="odometerAtSchedule"
                  editorType="dxNumberBox"
                  editorOptions={{
                    placeholder: "Enter or pull from GPS",
                  }}
                >
                  <Label text="Odometer at Schedule (km)" />
                </SimpleItem>
              </GroupItem>

              <GroupItem caption="Details" colSpan={1}>
                <SimpleItem
                  dataField="description"
                  editorType="dxTextArea"
                  editorOptions={{
                    height: 100,
                    placeholder: "Describe the maintenance work",
                  }}
                >
                  <Label text="Description" />
                </SimpleItem>

                <SimpleItem
                  dataField="notes"
                  editorType="dxTextArea"
                  editorOptions={{
                    height: 100,
                    placeholder: "Additional notes",
                  }}
                >
                  <Label text="Notes" />
                </SimpleItem>

                <SimpleItem
                  dataField="issueNote"
                  editorType="dxTextArea"
                  editorOptions={{
                    height: 100,
                    placeholder: "Note any issues encountered",
                  }}
                >
                  <Label text="Issue Note" />
                </SimpleItem>
              </GroupItem>
            </Form>

            <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6 tw-pb-4">
              <Button
                text="Cancel"
                onClick={() => setShowPopup(false)}
                stylingMode="outlined"
              />
              <Button text="Save" type="success" onClick={handleSave} />
            </div>
          </div>
        </ScrollView>
      </Popup>

      {/* Summary Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mt-6">
        <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-blue-600 tw-font-medium">
                Total Records
              </p>
              <p className="tw-text-2xl tw-font-bold tw-text-blue-900">
                {maintenanceData.length}
              </p>
            </div>
            <i className="fa-light fa-wrench tw-text-2xl tw-text-blue-600"></i>
          </div>
        </div>

        <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-yellow-600 tw-font-medium">
                Pending
              </p>
              <p className="tw-text-2xl tw-font-bold tw-text-yellow-900">
                {
                  maintenanceData.filter(
                    (item) =>
                      item.status === "Scheduled" ||
                      item.status === "In Progress"
                  ).length
                }
              </p>
            </div>
            <i className="fa-light fa-clock tw-text-2xl tw-text-yellow-600"></i>
          </div>
        </div>

        <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-green-600 tw-font-medium">
                Completed
              </p>
              <p className="tw-text-2xl tw-font-bold tw-text-green-900">
                {
                  maintenanceData.filter((item) => item.status === "Completed")
                    .length
                }
              </p>
            </div>
            <i className="fa-light fa-check-circle tw-text-2xl tw-text-green-600"></i>
          </div>
        </div>

        <div className="tw-bg-purple-50 tw-p-4 tw-rounded-lg tw-border tw-border-purple-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-purple-600 tw-font-medium">
                Overdue
              </p>
              <p className="tw-text-2xl tw-font-bold tw-text-purple-900">
                {maintenanceData.filter((item) => item.isOverdue).length}
              </p>
            </div>
            <i className="fa-light fa-exclamation-triangle tw-text-2xl tw-text-purple-600"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleMaintenanceHistory;
