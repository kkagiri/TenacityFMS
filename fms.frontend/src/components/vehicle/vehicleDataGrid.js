import React, {
  useEffect,
  useCallback,
  useRef,
  useState,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVehicleList,
  updateVehicle,
} from "../../redux/actions/vehicleActions";
import { fetchVehicleManufacturers } from "../../redux/actions/vehicleManufacturerActions";
import { fetchVehicleModels } from "../../redux/actions/vehicleModelActions";
import { fetchVehicleTypes } from "../../redux/actions/vehicleTypeActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import { fetchEmployees } from "../../redux/actions/employeeActions";
import { fetchUsers } from "../../redux/actions/userActions";
import { fetchpermissionbyUserId } from "../../redux/actions/permissionActions";
import { fetchTags } from "../../redux/actions/tagActions";
import notify from "devextreme/ui/notify";
import { Popup } from "devextreme-react/popup";
import LoadIndicator from "devextreme-react/load-indicator";
import Button from "devextreme-react/button";
import "./VehicleDataGrid.scss"; // Import the SCSS file
import DataGrid, {
  Paging,
  HeaderFilter,
  SearchPanel,
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
  Summary,
  GroupItem,
  FilterPanel,
  StateStoring,
  LoadPanel,
} from "devextreme-react/data-grid";
import TagAssignmentForm from "./../Tags/TagAssignmentForm/TagAssignmentForm";
// import FuelRuleSetAssignmentForm from './../fuelingRule/assignmentForm/fuelRuleSetAssignmentForm';

const VehicleDataGrid = () => {
  const dispatch = useDispatch();
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
  const users = useSelector((state) => state.user.users);
  const user = useSelector((state) => state.auth.user);
  const permissions = useSelector((state) => state.permission.permissions);
  const tags = useSelector((state) => state.tag.tags);
  const fuelingRules = useSelector((state) => state.fuelingRule.fuelingRules);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showTagForm, setShowTagForm] = useState(false);
  const [showRuleSetForm, setShowRuleSetForm] = useState(false);
  const exportFormats = ["xlsx"];

  const gridRef = useRef(null);
  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchVehicleManufacturers()),
        dispatch(fetchVehicleModels()),
        dispatch(fetchVehicleTypes()),
        dispatch(fetchSiteList()),
        dispatch(fetchEmployees()),
        dispatch(fetchUsers()),
        dispatch(fetchpermissionbyUserId(user.id)),
        dispatch(fetchTags()),
        dispatch(fetchVehicleList()),
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      const updatePayload = {
        vehicleId,
        ...cleanData,
      };

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

  const canEdit = permissions.includes("_EditVehicle");

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

  const handleRuleSetButtonClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowRuleSetForm(true);
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
      <DataGrid
        ref={gridRef}
        dataSource={vehicles}
        keyExpr={"vehicleId"}
        showBorders={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        rowAlernationEnable={true}
        repaintChangesOnly={true}
        onRowUpdated={onRowUpdated}
        onEditorPreparing={onEditorPreparing}
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
          mode="batch"
          allowUpdating={true}
          selectTextOnEditStart={true}
          startEditAction="dblClick"
        />
        <Column
          dataField="vehicleId"
          caption="Vehicle ID"
          allowEditing={false}
          visible={true}
          defaultSortOrder="asc"
        />
        <Column
          dataField="hyoungNo"
          allowHiding={false}
          fixed={true}
          caption="Hyoung No"
          allowEditing={true}
          minWidth={100}
        />
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
          hidingPriority={4}
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
          width={140}
          caption="Fuel Rule Set"
          cellRender={(cellData) => (
            <Button
              text="Assign Rule Set"
              onClick={(e) => {
                e.event.stopPropagation();
                handleRuleSetButtonClick(cellData.data);
              }}
              stylingMode="contained"
              type="default"
            />
          )}
        />
      </DataGrid>

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
