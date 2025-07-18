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
          allowUpdating={canEdit}
          allowAdding={false}
          allowDeleting={false}
          selectTextOnEditStart={true}
          startEditAction="dblClick"
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
          allowEditing={true}
          minWidth={100}
        >
          <RequiredRule />
        </Column>
        <Column dataField="passenger" caption="Passenger" minWidth={150} />
        <Column dataField="workingSiteId" caption="Working Site" minWidth={100}>
          <Lookup dataSource={site} valueExpr="id" displayExpr="name" />
        </Column>
        <Column dataField="vehicleTypeId" caption="Vehicle Type" minWidth={150}>
          <Lookup dataSource={vehicleType} valueExpr="id" displayExpr="name" />
        </Column>
        <Column
          dataField="defaultExpectedAverageId"
          minWidth={100}
          caption="Default Expected AVG"
          alignment="center"
          hidingPriority={0}
        />
        <Column dataField="averageKmL" caption="is km/l" minWidth={100} />
        <Column
          dataField="defaultEmployeeId"
          caption="Default Driver"
          minWidth={230}
        >
          <Lookup dataSource={employee} valueExpr="id" displayExpr="fullName" />
        </Column>
        <Column
          dataField="vehicleManufacturerId"
          caption="Vehicle Manufacturer"
          minWidth={200}
        >
          <Lookup
            dataSource={manufacturers}
            valueExpr="id"
            displayExpr="name"
          />
        </Column>
        <Column
          dataField="vehicleModelId"
          caption="Vehicle Model"
          minWidth={200}
          calculateDisplayValue={vehicleModelDisplayValue}
        >
          <Lookup dataSource={[]} valueExpr="id" displayExpr="name" />
        </Column>
        <Column
          dataField="excessWorkingHrCost"
          caption="Excess Working Hr Cost"
          dataType="number"
          setCellValue={(newData, value) => {
            newData.excessWorkingHrCost = Math.max(
              0,
              Math.min(10000, Number(value))
            );
          }}
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
        />
        <Column
          type="buttons"
          width={120}
          caption="Actions"
          cellRender={(cellData) => (
            <Button
              text="View Details"
              icon="fa-light fa-eye"
              onClick={(e) => {
                e.event.stopPropagation();
                handleViewDetails(cellData.data);
              }}
              stylingMode="outlined"
              type="default"
              className="tw-text-sm"
            />
          )}
        />

      </DataGrid>
      )}

      <Popup
        visible={showTagForm}
        onHiding={() => setShowTagForm(false)}
        dragEnabled={false}
        showTitle={true}
        title={`Assign RFID Tag to Vehicle ${selectedVehicle?.hyoungNo}`}
        width="auto"
        height="auto"
        position={{ my: "center", at: "center", of: window }}
      >
        <TagAssignmentForm
          vehicle={selectedVehicle}
          tags={tags}
          onClose={() => setShowTagForm(false)}
        />
      </Popup>
      {/* {showRuleSetForm && <FuelRuleSetAssignmentForm vehicle={selectedVehicle} />} */}
    </div>
  );
};

export default VehicleDataGrid;
