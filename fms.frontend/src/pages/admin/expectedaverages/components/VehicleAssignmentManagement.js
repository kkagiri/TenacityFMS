import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataGrid, {
  Column,
  Paging,
  FilterRow,
  SearchPanel,
  Toolbar,
  Item,
  HeaderFilter
} from 'devextreme-react/data-grid';

import { fetchVehicleAssignments } from '../../../../redux/slices/expectedFuelAverageSlice';

const VehicleAssignmentManagement = () => {
  const dispatch = useDispatch();
  const { vehicleAssignments, isLoading } = useSelector(state => state.expectedFuelAverage);

  useEffect(() => {
    dispatch(fetchVehicleAssignments());
  }, [dispatch]);

  // Render measurement type cell
  const renderMeasurementType = (cellData) => {
    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${
        cellData.value ? 'tw-bg-blue-100 tw-text-blue-800' : 'tw-bg-green-100 tw-text-green-800'
      }`}>
        {cellData.value ? 'km/L' : 'L/hr'}
      </span>
    );
  };

  return (
    <div className="vehicle-assignment-management">
      <DataGrid
        dataSource={vehicleAssignments}
        keyExpr="vehicleId"
        showBorders={true}
        showRowLines={true}
        rowAlternationEnabled={true}
        columnAutoWidth={true}
        allowColumnResizing={true}
        height="calc(100vh - 350px)"
      >
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <SearchPanel visible={true} width={240} placeholder="Search vehicles..." />
        <Paging defaultPageSize={20} />

        <Toolbar>
          <Item location="before">
            <span className="tw-text-sm tw-text-gray-600">
              Filter by vehicles without assignments to bulk assign
            </span>
          </Item>
          <Item name="searchPanel" />
        </Toolbar>

        <Column dataField="vehicleHyoungNo" caption="Vehicle" width={120} />
        <Column dataField="vehicleTypeName" caption="Type" width={100} />
        <Column
          dataField="isKmPerLiter"
          caption="Measure"
          width={80}
          cellRender={renderMeasurementType}
        />
        <Column
          dataField="totalAssignments"
          caption="Assignments"
          width={100}
          cellRender={(cellData) => (
            <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs ${
              cellData.value > 0 ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-yellow-100 tw-text-yellow-800'
            }`}>
              {cellData.value || 0}
            </span>
          )}
        />
        <Column
          dataField="defaultAssignment.templateName"
          caption="Default Template"
          width={200}
        />
        <Column
          caption="Default Expected"
          width={120}
          calculateCellValue={(rowData) => {
            if (!rowData.defaultAssignment) return '-';
            const value = rowData.defaultAssignment.overrideExpectedValue ||
              rowData.defaultAssignment.template?.expectedValue;
            const unit = rowData.isKmPerLiter ? 'km/L' : 'L/hr';
            return value ? `${value.toFixed(2)} ${unit}` : '-';
          }}
        />
      </DataGrid>
    </div>
  );
};

export default VehicleAssignmentManagement;
