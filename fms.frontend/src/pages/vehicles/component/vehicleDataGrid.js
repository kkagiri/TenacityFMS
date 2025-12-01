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
  getVehicleById,
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
import { Popup } from "devextreme-react/popup";
import LoadIndicator from "devextreme-react/load-indicator";
import Button from "devextreme-react/button";
import "./VehicleDataGrid.scss"; // Import the SCSS file
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
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
  Export,
  Selection,
  // Summary, // Not currently used
  // GroupItem, // Not currently used
  // FilterPanel, // Not currently used
  StateStoring,
  LoadPanel,
} from "devextreme-react/data-grid";
import TagAssignmentForm from "../../../components/Tags/TagAssignmentForm/TagAssignmentForm";
import VehicleEditForm from "./VehicleEditForm";
// import FuelRuleSetAssignmentForm from './../fuelingRule/assignmentForm/fuelRuleSetAssignmentForm';

const VehicleDataGrid = () => {
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
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  // const [showRuleSetForm, setShowRuleSetForm] = useState(false); // Not currently used
  const exportFormats = ["xlsx"];

  const gridRef = useRef(null);
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

  const canEdit = permissions.includes("_EditVehicle");
  // const canCreate = permissions.includes("_CreateVehicle"); // Moved to popup-based creation

  const onExporting = useCallback((e) => {
    try {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Vehicles');

      notify('Preparing export...', 'info', 2000);

      exportDataGrid({
        component: e.component,
        worksheet,
        autoFilterEnabled: true,
        customizeCell: ({ gridCell, excelCell }) => {
          if (gridCell.rowType === 'data') {
            excelCell.font = { size: 12 };
          }
          if (gridCell.rowType === 'header') {
            excelCell.font = { bold: true };
          }
        }
      }).then(() => {
        workbook.xlsx.writeBuffer()
          .then((buffer) => {
            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Vehicles.xlsx');
            notify('Export complete', 'success', 2000);
          })
          .catch(err => {
            console.error("Buffer creation error:", err);
            notify('Export failed', 'error', 2000);
          });
      }).catch(err => {
        console.error("exportDataGrid error:", err);
        notify('Export failed', 'error', 2000);
      });

      e.cancel = true;
    } catch (error) {
      console.error("General export error:", error);
      notify('Export failed', 'error', 2000);
    }
  }, []);

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

  // Navigation handlers
  const handleViewDetails = (vehicle) => {
    navigate(`/vehicles/${vehicle.vehicleId}/details`);
  };

  const handleRowClick = (e) => {
    if (e.rowType === 'data') {
      handleViewDetails(e.data);
    }
  };

  // Edit handler
  const handleEditClick = async (vehicle) => {
    try {
      setSaving(true); // Use saving state instead of loading to avoid hiding the grid
      const response = await dispatch(getVehicleById(vehicle.vehicleId));
      if (response && response.data) {
        setEditingVehicle(response.data);
        setShowEditForm(true);
      } else {
        notify('Failed to load vehicle details', 'error', 3000);
      }
    } catch (error) {
      console.error('Error loading vehicle for edit:', error);
      notify('Failed to load vehicle details', 'error', 3000);
    } finally {
      setSaving(false);
    }
  };

  // Save edited vehicle
  const handleSaveEdit = async (formData) => {
    try {
      setSaving(true);
      const response = await dispatch(updateVehicle(editingVehicle.vehicleId, formData));

      if (response && response.success) {
        notify('Vehicle updated successfully', 'success', 3000);

        // Close popup and clear editing state ONLY on success
        setShowEditForm(false);
        setEditingVehicle(null);

        // Refresh the grid
        await dispatch(fetchVehicleList());
      } else {
        // Handle error response - don't close popup
        const errorMessage = response?.message || 'Failed to update vehicle';
        const requiredPerms = response?.requiredPermissions?.join(', ') || '';
        const fullMessage = requiredPerms
          ? `${errorMessage}\nRequired permissions: ${requiredPerms}`
          : errorMessage;

        notify(fullMessage, 'error', 5000);
        // Don't close popup - let user try again or cancel manually
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);

      // Handle different error types
      let errorMessage = 'Failed to save vehicle';

      if (error.response?.status === 400) {
        // Handle validation errors
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          const errorMessages = Object.entries(validationErrors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          errorMessage = `Validation Error:\n${errorMessages}`;
        } else if (error.response?.data?.title) {
          errorMessage = error.response.data.title;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.response?.status === 403) {
        errorMessage = error.response?.data?.message || 'Access denied. Insufficient permissions.';
        const requiredPerms = error.response?.data?.requiredPermissions?.join(', ') || '';
        if (requiredPerms) {
          errorMessage += `\nRequired permissions: ${requiredPerms}`;
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      notify(errorMessage, 'error', 5000);
      // Don't close popup on error - let user try again or cancel manually
    } finally {
      setSaving(false);
    }
  };

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
          rowAlernationEnable={true}
          repaintChangesOnly={true}        onRowUpdated={onRowUpdated}
        onEditorPreparing={onEditorPreparing}
        onExporting={onExporting}
          scrolling={{ mode: 'standard' }}
          onRowClick={handleRowClick}
        >
        <Export
          enabled={true}
          allowExportSelectedData={true}
          formats={exportFormats}
        />
        <StateStoring
          enabled={true}
          type="sessionStorage"
          storageKey="vehicleGridState"
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

          <TItems name="exportButton" locateInMenu={'auto'} />
          <TItems name="columnChooserButton" />
          <TItems
            location='after'
            showText='inMenu'
            widget='dxButton'
          >

          </TItems>
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
          dataField="hyoungNo"
          allowHiding={false}
          fixed={true}
          caption="Hyoung No"
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
          caption="Passenger Capacity"
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
          dataType="datetime"
          format="dd/MM/yyyy HH:mm"
          minWidth={150}
          visible={false}
          allowEditing={false}
        />

        <Column
          dataField="dateModified"
          caption="Date Modified"
          dataType="datetime"
          format="dd/MM/yyyy HH:mm"
          minWidth={150}
          visible={false}
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

        <Column
          type="buttons"
          width={150}
          caption="Actions"
          fixed={true}
          fixedPosition="right"
          cellRender={(cellData) => (
            <div className="tw-flex tw-gap-2">
              <Button
                icon="fa-light fa-edit"
                hint="Edit Vehicle"
                onClick={(e) => {
                  e.event.stopPropagation();
                  handleEditClick(cellData.data);
                }}
                stylingMode="text"
                type="default"
              />
              <Button
                icon="fa-light fa-eye"
                hint="View Details"
                onClick={(e) => {
                  e.event.stopPropagation();
                  handleViewDetails(cellData.data);
                }}
                stylingMode="text"
                type="default"
              />
            </div>
          )}
        />

      </DataGrid>
      )}

      {/* Tag Assignment Popup */}
      <Popup
        visible={showTagForm}
        onHiding={() => setShowTagForm(false)}
        dragEnabled={false}
        showTitle={true}
        title={`Assign RFID Tag to Vehicle ${selectedVehicle?.hyoungNo}`}
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

      {/* Edit Vehicle Popup */}
      <Popup
        visible={showEditForm}
        onHiding={() => {
          if (!saving) { // Prevent closing while saving
            setShowEditForm(false);
            setEditingVehicle(null);
          }
        }}
        dragEnabled={false}
        showTitle={true}
        title={`Edit Vehicle - ${editingVehicle?.hyoungNo || ''}`}
        width="90%"
        height="90%"
        showCloseButton={!saving}
        closeOnOutsideClick={false}
      >
        {/* Loading Panel Overlay */}
        {saving && (
          <div className="tw-absolute tw-inset-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-items-center tw-justify-center tw-z-50">
            <div className="tw-flex tw-flex-col tw-items-center">
              <LoadIndicator width="48px" height="48px" visible={true} />
              <span className="tw-mt-4 tw-text-gray-700 tw-font-medium">Saving changes...</span>
            </div>
          </div>
        )}

        <div className="tw-p-4">
          {editingVehicle ? (
            <VehicleEditForm
              vehicle={editingVehicle}
              isEditing={true}
              onSave={handleSaveEdit}
              isSaving={saving}
            />
          ) : (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
              <LoadIndicator visible={true} />
              <span className="tw-ml-3 tw-text-gray-600">Loading vehicle data...</span>
            </div>
          )}
        </div>
      </Popup>

      {/* {showRuleSetForm && <FuelRuleSetAssignmentForm vehicle={selectedVehicle} />} */}
    </div>
  );
};

export default VehicleDataGrid;
