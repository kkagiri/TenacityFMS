/**
 * File:          VehicleDataGrid.js
 * Purpose:       Renders the vehicle fleet DataGrid with CSV export, column chooser, refresh, and row selection actions.
 * Dependencies:  React, Redux, DevExtreme DataGrid, file-saver
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - fetchData(): Loads lookup data and vehicle records for the fleet grid.
 * - handleExportCsv(): Exports the current vehicle grid view to CSV.
 * - handleRowClick(): Opens the selected vehicle in the detail panel.
 */
import React, {
  useEffect,
  useCallback,
  useRef,
  useState,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchVehicleList,
  updateVehicle,
  // createVehicle, // Moved to popup-based creation
} from "../../../redux/actions/vehicleActions";
import { fetchVehicleManufacturers } from "../../../redux/actions/vehicleManufacturerActions";
import { fetchVehicleModels } from "../../../redux/actions/vehicleModelActions";
import { fetchVehicleTypes } from "../../../redux/actions/vehicleTypeActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchEmployees } from "../../../redux/actions/employeeActions";
import { fetchUsers } from "../../../redux/actions/userActions";
import { fetchpermissionbyUserId } from "../../../redux/actions/permissionActions";
import { fetchTags } from "../../../redux/actions/tagActions";
import notify from "devextreme/ui/notify";
import { Popup } from "devextreme-react/popup"; // still used for tag assignment
import LoadIndicator from "devextreme-react/load-indicator";
import Button from "devextreme-react/button";
import "./VehicleDataGrid.scss";
import saveAs from 'file-saver';
import DataGrid, {
  Paging,
  HeaderFilter,
  // SearchPanel, // Not currently used
  Editing,
  FilterRow,
  Column,
  Lookup,
  Sorting,
  RequiredRule,
  ColumnChooser,
  Toolbar,
  Item as TItems,
  Selection,
  // Summary, // Not currently used
  // GroupItem, // Not currently used
  // FilterPanel, // Not currently used
  StateStoring,
  LoadPanel,
} from "devextreme-react/data-grid";
import TagAssignmentForm from "../../../components/Tags/TagAssignmentForm/TagAssignmentForm";
// VehicleEditForm removed — editing handled via VehicleDetailPanel
// import FuelRuleSetAssignmentForm from './../fuelingRule/assignmentForm/fuelRuleSetAssignmentForm';

const formatLocalDateTime = (value) => {
  if (!value) return "";
  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) return "";
  return dateValue.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatAsLocalDateIfPossible = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    return value;
  }
  return formatLocalDateTime(dateValue);
};

const VehicleDataGrid = ({ onSelectVehicle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const manufacturers = useSelector(
    (state) => state.vehicleManufacturer.manufacturers
  );
  const allVehicleModels = useSelector(
    (state) => state.vehicleModel.vehicleModels
  );
  const vehicleType = useSelector((state) => state.vehicleType.vehicleTypes);
  const site = useSelector((state) => state.site.sites);
  const employee = useSelector((state) => state.employee.employees);
  // const users = useSelector((state) => state.user.users); // Not currently used
  const user = useSelector((state) => state.auth.user);
  const permissions = useSelector((state) => state.permission.permissions);
  const tags = useSelector((state) => state.tag.tags);
  // const fuelingRules = useSelector((state) => state.fuelingRule.fuelingRules); // Not currently used

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showTagForm, setShowTagForm] = useState(false);
  // Edit form state removed — editing handled via VehicleDetailPanel
  // const [showEditForm, setShowEditForm] = useState(false);
  // const [editingVehicle, setEditingVehicle] = useState(null);
  // const [showRuleSetForm, setShowRuleSetForm] = useState(false); // Not currently used
  const gridRef = useRef(null);

  const escapeCsvValue = useCallback((value) => {
    if (value === null || value === undefined) {
      return "";
    }

    const normalizedValue = String(value).replace(/\r?\n|\r/g, " ");
    const escapedValue = normalizedValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }, []);

  const resolveLookupDisplayValue = useCallback((lookupConfig, rawValue) => {
    if (!lookupConfig || rawValue === null || rawValue === undefined || rawValue === "") {
      return rawValue;
    }

    const lookupItems = Array.isArray(lookupConfig.dataSource)
      ? lookupConfig.dataSource
      : [];

    const valueExpr = lookupConfig.valueExpr ?? "id";
    const displayExpr = lookupConfig.displayExpr ?? "name";
    const matchedItem = lookupItems.find((item) => item?.[valueExpr] === rawValue);

    return matchedItem?.[displayExpr] ?? rawValue;
  }, []);

  const resolveExportValue = useCallback(
    (column, rowData) => {
      if (!column?.dataField) {
        return "";
      }

      if (typeof column.calculateDisplayValue === "function") {
        return column.calculateDisplayValue(rowData);
      }

      const rawValue = rowData[column.dataField];

      if (column.lookup) {
        return resolveLookupDisplayValue(column.lookup, rawValue);
      }

      if (column.dataType === "boolean") {
        return rawValue ? "Yes" : "No";
      }

      if (column.dataType === "date" || column.dataField.toLowerCase().includes("date")) {
        return formatAsLocalDateIfPossible(rawValue);
      }

      return rawValue;
    },
    [resolveLookupDisplayValue]
  );
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Starting to fetch vehicle data...');

      // Fetch essential data first
      await Promise.all([
        dispatch(fetchVehicleManufacturers()),
        dispatch(fetchVehicleModels()),
        dispatch(fetchVehicleTypes()),
        dispatch(fetchSiteList()),
        dispatch(fetchEmployees()),
        dispatch(fetchUsers()),
        dispatch(fetchpermissionbyUserId(user.id)),
        dispatch(fetchTags())
      ]);

      console.log('Basic data loaded, now fetching vehicles...');

      // Fetch vehicles separately with better error handling
      const vehicleResult = await dispatch(fetchVehicleList());
      console.log('Vehicle fetch result:', vehicleResult);

      if (!vehicleResult) {
        throw new Error('Failed to load vehicle data');
      }

      notify({
        message: 'Vehicle data loaded successfully',
        type: 'success',
        displayTime: 2000
      });

    } catch (error) {
      console.error('Error fetching vehicle data:', error);

      // Show user-friendly error message
      let errorMessage = 'Failed to load vehicle data';

      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMessage = 'Connection timeout. Please check your network connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Vehicle service not found. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      notify({
        message: errorMessage,
        type: 'error',
        displayTime: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [dispatch, user.id]);

  useEffect(() => {
    console.log('VehicleDataGrid mounted, starting data fetch...');
    fetchData();
  }, [fetchData]);

  // Debug: Log vehicles state changes
  useEffect(() => {
    console.log('Vehicles state updated:', vehicles);
    console.log('Vehicles count:', vehicles?.length || 0);
  }, [vehicles]);

  const modelLookup = useMemo(() => {
    return allVehicleModels.reduce((acc, model) => {
      if (!acc[model.manufacturerId]) {
        acc[model.manufacturerId] = [];
      }
      acc[model.manufacturerId].push(model);
      return acc;
    }, {});
  }, [allVehicleModels]);

  const refresh = () => {
    console.log('Refreshing vehicle data...');
    fetchData();
  };

  const retryFetch = () => {
    console.log('Retrying vehicle data fetch...');
    setLoading(true);
    fetchData();
  };

  const onEditorPreparing = (e) => {
    if (e.dataField === "vehicleModelId" && e.parentType === "dataRow") {
      const currentManufacturerId = e.row.data.vehicleManufacturerId;
      e.editorOptions.dataSource = modelLookup[currentManufacturerId] || [];
    }
  };

  const vehicleModelDisplayValue = (rowData) => {
    if (rowData.vehicleManufacturerId && rowData.vehicleModelId) {
      const modelOptions = modelLookup[rowData.vehicleManufacturerId] || [];
      const model = modelOptions.find((m) => m.id === rowData.vehicleModelId);
      return model ? model.name : "";
    }
    return "";
  };

  const onRowUpdated = async (e) => {
    e.cancel = true;
    if (saving) return;

    try {
      setSaving(true);

      // Create a deep copy of the data to avoid mutation
      const updatedData = JSON.parse(JSON.stringify(e.data));
      const { vehicleId, ...cleanData } = updatedData;

      // Handle workingSiteId specifically
      if (cleanData.workingSiteId === 0) {
        cleanData.workingSiteId = null;
      }

      // Create a new object for the update
      // const updatePayload = {
      //   vehicleId,
      //   ...cleanData,
      // }; // Not currently used - data passed directly to updateVehicle

      const response = await dispatch(updateVehicle(vehicleId, cleanData));

      if (response.success) {
        // Instead of refetching all data, update the grid data directly
        if (gridRef.current && gridRef.current.instance) {
          const currentData = gridRef.current.instance.getDataSource().items();
          const updatedData = currentData.map((item) =>
            item.vehicleId === vehicleId ? { ...item, ...cleanData } : item
          );
          gridRef.current.instance.getDataSource().items(updatedData);
          gridRef.current.instance.cancelEditData();
        }
        notify(response.message, "success", 3000);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error:", error);
      notify(error.message, "error", 5000);
      if (gridRef.current && gridRef.current.instance) {
        gridRef.current.instance.cancelEditData();
      }
    } finally {
      setSaving(false);
    }
  };

  // onRowInserted removed - using popup-based vehicle creation instead

  const canEdit = permissions.includes("_Edit_Vehicle");
  // const canCreate = permissions.includes("_CreateVehicle"); // Moved to popup-based creation

  const handleExportCsv = useCallback(() => {
    try {
      const gridInstance = gridRef.current?.instance;

      if (!gridInstance) {
        notify("Grid is not ready for export", "warning", 2000);
        return;
      }

      const visibleColumns = gridInstance
        .getVisibleColumns()
        .filter((column) => column?.dataField && column?.allowExporting !== false);

      const rows = gridInstance.getDataSource().items();

      if (!rows.length) {
        notify("No vehicle data available to export", "warning", 2000);
        return;
      }

      notify("Preparing CSV export...", "info", 2000);

      const headerRow = visibleColumns.map((column) => escapeCsvValue(column.caption || column.dataField));
      const dataRows = rows.map((row) =>
        visibleColumns.map((column) => escapeCsvValue(resolveExportValue(column, row)))
      );

      const csvContent = [headerRow, ...dataRows].map((row) => row.join(",")).join("\r\n");
      const csvBlob = new Blob([`\uFEFF${csvContent}`], {
        type: "text/csv;charset=utf-8;",
      });

      saveAs(csvBlob, "Vehicles.csv");
      notify("CSV export complete", "success", 2000);
    } catch (error) {
      console.error("CSV export error:", error);
      notify("CSV export failed", "error", 2000);
    }
  }, [escapeCsvValue, resolveExportValue]);

  // const addRow = () => {
  //   gridRef.current.instance.addRow();
  // }; // Removed - using popup-based creation

  if (loading || saving) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <LoadIndicator width={"24px"} height={"24px"} visible={true} />
      </div>
    );
  }

  const handleAddNewTagClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowTagForm(true);
  };

  // const handleRuleSetButtonClick = (vehicle) => {
  //   setSelectedVehicle(vehicle);
  //   setShowRuleSetForm(true);
  // }; // Removed - functionality not currently implemented

  // Navigation / selection handlers
  const handleViewDetails = (vehicle) => {
    if (onSelectVehicle) {
      onSelectVehicle(vehicle.vehicleId);
    } else {
      navigate(`/vehicles/${vehicle.vehicleId}/details`);
    }
  };

  const handleRowClick = (e) => {
    if (e.rowType === 'data') {
      handleViewDetails(e.data);
    }
  };

  // Edit handler — opens the detail panel (which has its own edit sub-panel)
  const handleEditClick = (vehicle) => {
    if (onSelectVehicle) {
      onSelectVehicle(vehicle.vehicleId);
    } else {
      navigate(`/vehicles/${vehicle.vehicleId}/details`);
    }
  };

  // Save edit removed — handled by VehicleDetailPanel

  const TagsCell = ({ data, handleAddNewTagClick }) => {
    const { tags } = data;

    const handleAddNew = () => {
      handleAddNewTagClick(data);
    };

    return (
      <div className="tags-cell">
        {tags && tags.length > 0 ? (
          tags.map((tag, index) => (
            <a
              key={index}
              href="#!"
              onClick={(e) => {
                e.preventDefault();
                // Implement RFID tag click functionality if needed
                console.log(`Clicked on RFID Tag: ${tag}`);
              }}
              className="tag-link"
            >
              {tag}
            </a>
          ))
        ) : (
          <span className="no-tags">No Tags</span>
        )}
        <a
          href="#!"
          onClick={(e) => {
            e.preventDefault();
            handleAddNew();
          }}
          className="add-new-link"
        >
          Add New
        </a>
      </div>
    );
  };



  return (
    <div>

      {/* Loading State */}
      {loading && (
        <div className="tw-flex tw-justify-center tw-items-center tw-py-8">
          <LoadIndicator visible={true} />
          <span className="tw-ml-3 tw-text-gray-600">Loading vehicle data...</span>
        </div>
      )}

      {/* No Data State */}
      {!loading && vehicles.length === 0 && (
        <div className="tw-flex tw-flex-col tw-justify-center tw-items-center tw-py-12 tw-bg-gray-50 tw-rounded-lg tw-border-2 tw-border-dashed tw-border-gray-300">
          <i className="fa-light fa-truck tw-text-6xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-xl tw-font-semibold tw-text-gray-700 tw-mb-2">No Vehicles Found</h3>
          <p className="tw-text-gray-500 tw-mb-4">
            There might be a connection issue or no vehicles have been added yet.
          </p>
          <div className="tw-flex tw-gap-2">

            <Button
              text="Retry Loading"
              type="default"
              stylingMode="contained"
              icon="refresh"
              onClick={retryFetch}
            />
          </div>
        </div>
      )}

      {/* DataGrid - Only show when not loading and we have data */}
      {!loading && vehicles.length > 0 && (
        <DataGrid
          ref={gridRef}
          dataSource={vehicles}
          keyExpr={"vehicleId"}
          showBorders={true}
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          columnHidingEnabled={false}
          rowAlernationEnable={true}
          repaintChangesOnly={true} onRowUpdated={onRowUpdated}
          onEditorPreparing={onEditorPreparing}
          scrolling={{ mode: 'standard' }}
          onRowClick={handleRowClick}
        >
          <StateStoring
            enabled={true}
            type="sessionStorage"
            storageKey="vehicleGridStateV3"
          />
          <Paging enabled={true} defaultPageSize={30} />
          <ColumnChooser enabled={true} mode="select" height={200} />
          <LoadPanel enabled={true} />
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <Selection mode="multiple" />
          <Sorting mode="multiple" />
          <Editing
            mode="row"
            allowUpdating={false}
            allowAdding={false}
            allowDeleting={false}
          />

          <Toolbar>
            <TItems
              location='after'
              widget='dxButton'
            >
              <Button
                icon='export'
                text='Export CSV'
                stylingMode='contained'
                type='default'
                onClick={handleExportCsv}
              />
            </TItems>
            <TItems name="columnChooserButton" />
            <TItems
              location='after'
              showText='inMenu'
              widget='dxButton'
            >
              <Button
                icon='refresh'
                text='Refresh'
                stylingMode='text'
                onClick={refresh}
              />
            </TItems>
          </Toolbar>

          {/* Column configuration matching VehicleDTO.cs */}
          <Column
            dataField="vehicleId"
            caption="Vehicle ID"
            allowEditing={false}
            visible={false}
            defaultSortOrder="asc"
          />

          <Column
            dataField="vehicleCode"
            allowHiding={false}
            fixed={true}
            caption="Tenacy No"
            allowEditing={false}
            minWidth={120}
          >
            <RequiredRule />
          </Column>

          <Column
            dataField="numberPlate"
            caption="Number Plate"
            minWidth={120}
            allowEditing={false}
          />

          <Column
            dataField="vehicleTypeId"
            caption="Vehicle Type"
            minWidth={150}
            allowEditing={false}
          >
            <Lookup dataSource={vehicleType} valueExpr="id" displayExpr="name" />
          </Column>

          <Column
            dataField="vehicleManufacturerId"
            caption="Manufacturer"
            minWidth={150}
            allowEditing={false}
          >
            <Lookup
              dataSource={manufacturers}
              valueExpr="id"
              displayExpr="name"
            />
          </Column>

          <Column
            dataField="vehicleModelId"
            caption="Model"
            minWidth={150}
            calculateDisplayValue={vehicleModelDisplayValue}
            allowEditing={false}
          >
            <Lookup dataSource={[]} valueExpr="id" displayExpr="name" />
          </Column>

          <Column
            dataField="yom"
            caption="Year"
            minWidth={80}
            allowEditing={false}
          />

          <Column
            dataField="workingSiteId"
            caption="Working Site"
            minWidth={150}
            allowEditing={false}
          >
            <Lookup dataSource={site} valueExpr="id" displayExpr="name" />
          </Column>

          <Column
            dataField="defaultEmployeeId"
            caption="Default Driver"
            minWidth={180}
            allowEditing={false}
          >
            <Lookup dataSource={employee} valueExpr="id" displayExpr="fullName" />
          </Column>

          <Column
            dataField="fuelTankCapacity"
            caption="Fuel Tank Capacity (L)"
            dataType="number"
            format="#,##0.00"
            minWidth={150}
            allowEditing={false}
          />

          <Column
            dataField="isFullTankPolicy"
            caption="Full Tank Policy"
            dataType="boolean"
            minWidth={120}
            allowEditing={false}
          />

          <Column
            dataField="passenger"
            caption="Passenger"
            minWidth={130}
            allowEditing={false}
          />

          <Column
            dataField="capacity"
            caption="Cargo Capacity"
            minWidth={120}
            allowEditing={false}
          />

          <Column
            dataField="currentPhysicalReading"
            caption="Current Reading"
            minWidth={130}
            allowEditing={false}
          />

          <Column
            dataField="defaultExptdAvgid"
            minWidth={150}
            caption="Expected AVG"
            alignment="center"
            hidingPriority={0}
            allowEditing={false}
          />

          <Column
            dataField="averageKmL"
            caption="Km/L"
            dataType="boolean"
            minWidth={80}
            allowEditing={false}
          />

          <Column
            dataField="excessWorkingHrCost"
            caption="Excess Hr Cost"
            dataType="number"
            format="#,##0.00"
            minWidth={120}
            allowEditing={false}
          />

          <Column
            dataField="hasGPSInstalled"
            caption="GPS"
            dataType="boolean"
            minWidth={80}
            allowEditing={false}
          />

          <Column
            dataField="gpsgategeneratedId"
            caption="GPS Gate ID"
            dataType="boolean"
            minWidth={100}
            visible={false}
            allowEditing={false}
          />

          <Column
            dataField="isCompanyVehicle"
            caption="Company Vehicle"
            dataType="boolean"
            minWidth={130}
            visible={false}
            allowEditing={false}
          />

          <Column
            dataField="isActive"
            caption="Active"
            dataType="boolean"
            minWidth={80}
            allowEditing={false}
          />

          <Column
            dataField="dateCreated"
            caption="Date Created"
            minWidth={150}
            visible={false}
            cellRender={(cellData) => formatLocalDateTime(cellData?.value)}
            allowEditing={false}
          />

          <Column
            dataField="dateModified"
            caption="Date Modified"
            minWidth={150}
            visible={false}
            cellRender={(cellData) => formatLocalDateTime(cellData?.value)}
            allowEditing={false}
          />

          <Column
            dataField="createdBy"
            caption="Created By"
            minWidth={120}
            visible={false}
            allowEditing={false}
          />

          <Column
            dataField="modifiedBy"
            caption="Modified By"
            minWidth={120}
            visible={false}
            cellRender={(cellData) => formatAsLocalDateIfPossible(cellData?.value)}
            allowEditing={false}
          />

          <Column
            caption="Tags"
            dataField="tags"
            cellRender={(cellData) => (
              <TagsCell
                data={cellData.data}
                handleAddNewTagClick={handleAddNewTagClick}
              />
            )}
            minWidth={200}
            allowSorting={false}
            allowFiltering={false}
            allowEditing={false}
          />

        </DataGrid>
      )}

      {/* Tag Assignment Popup */}
      <Popup
        visible={showTagForm}
        onHiding={() => setShowTagForm(false)}
        dragEnabled={false}
        showTitle={true}
        title={`Assign RFID Tag to Vehicle ${selectedVehicle?.vehicleCode}`}
        width="auto"
        height="auto"
        showCloseButton={true}
      >
        <TagAssignmentForm
          vehicle={selectedVehicle}
          tags={tags}
          onClose={() => setShowTagForm(false)}
        />
      </Popup>

      {/* Edit / detail viewing handled by VehicleDetailPanel in parent */}
    </div>
  );
};

export default VehicleDataGrid;
