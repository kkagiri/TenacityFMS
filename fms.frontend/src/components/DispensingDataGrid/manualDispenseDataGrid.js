import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import DataGrid, {
  Paging, HeaderFilter, SearchPanel, Toolbar, Item as TItems,
  Editing, FilterRow, Column, Lookup, Sorting, RequiredRule,
  Form, Popup, LoadPanel, Export, Selection, ColumnChooser, Position
} from 'devextreme-react/data-grid';
import Button from 'devextreme-react/button';
import { Item as FItem } from 'devextreme-react/form';

const ManualDispenseDataGrid = ({
  fuelRefills,
  vehicles,
  employees,
  sites,
  tanks,
  fuelBy,
  user,
  permissions,
  onSaving,
  onRowRemoved,
  onEditorPreparing,
  addRow,
  refresh,
  handleFieldChange,
  handleSiteChange,
  handleTankChange,
  formData,
  filteredTanks,
  noTanksAvailable,
  allowEditing = true, // New prop to control editing
  showAddButton = true // New prop to control "Add Fuel Refill" button visibility
}) => {
  const gridRef = useRef(null);
  const exportFormats = ['xlsx'];

  const canEdit = allowEditing && permissions.includes('_Edit_FuelRefill');
  const canDelete = allowEditing && permissions.includes('_Delete_FuelRefill');
  const canCreate = allowEditing && permissions.includes('_Create_FuelRefill');

  return (
    <DataGrid
      ref={gridRef}
      dataSource={fuelRefills}
      showBorders={true}
      keyExpr={'id'}
      allowColumnReordering={true}
      allowColumnResizing={true}
      columnAutoWidth={true}
      rowAlernationEnable={true}
      repaintChangesOnly={true}
      onRowRemoved={onRowRemoved}
      onSaving={onSaving}
      onEditorPreparing={onEditorPreparing}
    >
      <ColumnChooser enabled={true} mode="select" height={200}>
        <Position my="right top" at="right top" />
      </ColumnChooser>
      <LoadPanel enabled={true} />
      <Paging enabled={true} defaultPageSize={30} />
      <Export enabled={true} allowExportSelectedData={true} formats={exportFormats} />
      <FilterRow visible={true} />
      <HeaderFilter visible={true} />
      <SearchPanel visible placeholder='Data Search' />
      <Sorting mode="multiple" />
      <Selection mode="multiple" />

      {allowEditing && (
        <Editing
          mode="popup"
          allowUpdating={canEdit}
          allowAdding={canCreate}
          allowDeleting={canDelete}
          selectTextOnEditStart={true}
          startEditAction="dblClick"
          newRowPosition={'first'}
        >
          <Popup title="Add Fuel Refill" showTitle={true} width={800} />
          <Form formData={formData} onFieldDataChanged={handleFieldChange}>
            {/* Form items go here (same as in your original code) */}
          </Form>
        </Editing>
      )}

      <Toolbar>
        {showAddButton && canCreate && (
          <TItems location='before' locateInMenu='auto'>
            <Button
              icon='plus'
              text='Add Fuel Refill'
              type='default'
              stylingMode='contained'
              onClick={addRow}
            />
          </TItems>
        )}
        <TItems location='after' locateInMenu='auto' showText='inMenu' widget='dxButton'>
          <Button
            icon='refresh'
            text='Refresh'
            stylingMode='text'
            onClick={refresh}
          />
        </TItems>
        <TItems name="exportButton" locateInMenu={'auto'} />
        <TItems location='after' locateInMenu='auto'>
          <div className='separator' />
        </TItems>
        <TItems name="columnChooserButton" />
      </Toolbar>

      <Column dataField="date" caption="Date" dataType="date" defaultSortOrder={'dsc'} fixed={true} defaultValue={new Date().toISOString()} />
      <Column dataField="vehicleId" caption="Vehicle" minWidth={150}>
        <Lookup
          dataSource={vehicles}
          valueExpr="vehicleId"
          displayExpr="hyoungNo" // Adjust the field name based on your vehicle data
        />

      </Column>
      <Column dataField="siteId" caption="Site" minWidth={100} >
        <Lookup
          dataSource={sites}
          valueExpr="id"
          displayExpr="name"
        />

      </Column>


      <Column dataField="manualFuelrefilAmount" caption="Fuel Amount" dataType="number" width={120}>
      </Column>
      <Column dataField="previousMeterReading" caption="Previous Meter Readings" dataType="number" width={150} hidingPriority={3}>
      </Column>
      <Column dataField="currentMeterReading" caption="Current Meter Reading" dataType="number" width={150} hidingPriority={3} >
      </Column>
      <Column dataField="driverId" caption="Driver" minWidth={180} >
        <Lookup
          dataSource={employees}
          valueExpr="id"
          displayExpr="fullName"
        />
      </Column>



      <Column dataField="comment" caption="Comment" minWidth={180} hidingPriority={3} />
      <Column dataField="fuelBy" caption="Fuel By" minWidth={120} hidingPriority={2}
        cellRender={(cellData) => {
          const user = fuelBy.find(u => u.id === cellData.value);
          return user ? user.userName : cellData.value;
        }}>
        <Lookup dataSource={fuelBy} valueExpr="id" displayExpr="userName" />
      </Column>
    </DataGrid>
  );
};

export default ManualDispenseDataGrid;