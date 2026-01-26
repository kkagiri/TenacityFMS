import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid, Button, Popup, ScrollView, FileUploader } from "devextreme-react";
import {
  Column,
  Paging,
  SearchPanel,
  FilterRow,
  HeaderFilter,
  Export,
  Selection,
  Scrolling,
} from "devextreme-react/data-grid";
import {
  Form,
  SimpleItem,
  Label,
  RequiredRule,
  GroupItem,
} from "devextreme-react/form";
import notify from "devextreme/ui/notify";
import { confirm } from "devextreme/ui/dialog";
import {
  fetchMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  importMaintenanceRecords,
} from "../../../redux/actions/maintenanceActions";
import VehicleSearchableSelector from "../../../components/selectors/VehicleSearchableSelector";
import * as XLSX from "xlsx";

const MaintenanceList = () => {
  const dispatch = useDispatch();
  const { maintenanceRecords } = useSelector(
    (state) => state.maintenance || { maintenanceRecords: [] }
  );
  const [showPopup, setShowPopup] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileUploaderRef = useRef(null);

  // Maintenance types - can be fetched from backend or defined here
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

  useEffect(() => {
    dispatch(fetchMaintenanceRecords());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setFormData({
      vehicleId: null,
      maintenanceType: "",
      status: "Scheduled",
      scheduledDate: new Date(),
      priority: 2,
      notes: "",
      issueNote: "",
      description: "",
    });
    setEditMode(false);
    setShowPopup(true);
  };

  const handleEdit = (data) => {
    setFormData(data);
    setEditMode(true);
    setShowPopup(true);
  };

  const handleDelete = async (maintenanceId) => {
    const result = await confirm(
      "Are you sure you want to delete this maintenance record?",
      "Confirm Delete"
    );

    if (result) {
      try {
        await dispatch(deleteMaintenanceRecord(maintenanceId));
        notify("Maintenance record deleted successfully", "success", 3000);
      } catch (error) {
        notify("Error deleting maintenance record", "error", 3000);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await dispatch(
          updateMaintenanceRecord(formData.maintenanceId, formData)
        );
        notify("Maintenance record updated successfully", "success", 3000);
      } else {
        await dispatch(createMaintenanceRecord(formData));
        notify("Maintenance record created successfully", "success", 3000);
      }
      setShowPopup(false);
      dispatch(fetchMaintenanceRecords());
    } catch (error) {
      notify("Error saving maintenance record", "error", 3000);
    }
  };

  // Handle vehicle selection from searchable selector
  const handleVehicleChange = useCallback((e) => {
    setFormData(prev => ({
      ...prev,
      vehicleId: e.value
    }));
  }, []);

  // ============= IMPORT FUNCTIONS =============

  const handleImportClick = () => {
    setImportData([]);
    setImportErrors([]);
    setShowImportPopup(true);
  };

  const parseExcelFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const validateImportData = useCallback((rows) => {
    const errors = [];
    const validRecords = [];

    // Expected headers: Vehicle Number, Maintenance Type, Scheduled Date, Priority, Status, Description, Notes
    const headers = rows[0]?.map(h => h?.toString().toLowerCase().trim()) || [];

    const vehicleColIndex = headers.findIndex(h => h?.includes('vehicle') || h?.includes('hyoung'));
    const typeColIndex = headers.findIndex(h => h?.includes('type') || h?.includes('maintenance'));
    const dateColIndex = headers.findIndex(h => h?.includes('date') || h?.includes('scheduled'));
    const priorityColIndex = headers.findIndex(h => h?.includes('priority'));
    const statusColIndex = headers.findIndex(h => h?.includes('status'));
    const descColIndex = headers.findIndex(h => h?.includes('desc'));
    const notesColIndex = headers.findIndex(h => h?.includes('note'));

    if (vehicleColIndex === -1) {
      errors.push({ row: 1, message: 'Missing required column: Vehicle Number/Hyoung No' });
      return { validRecords, errors };
    }

    // Process data rows (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row[vehicleColIndex]) continue;

      const record = {
        vehicleNumber: row[vehicleColIndex]?.toString().trim(),
        maintenanceType: typeColIndex >= 0 ? row[typeColIndex]?.toString().trim() : 'General Repair',
        scheduledDate: dateColIndex >= 0 ? row[dateColIndex] : new Date(),
        priority: priorityColIndex >= 0 ? parseInt(row[priorityColIndex]) || 2 : 2,
        status: statusColIndex >= 0 ? row[statusColIndex]?.toString().trim() : 'Scheduled',
        description: descColIndex >= 0 ? row[descColIndex]?.toString().trim() : '',
        notes: notesColIndex >= 0 ? row[notesColIndex]?.toString().trim() : '',
        rowNumber: i + 1
      };

      // Validate required fields
      if (!record.vehicleNumber) {
        errors.push({ row: i + 1, message: 'Vehicle number is required' });
        continue;
      }

      // Parse date if it's an Excel serial number
      if (typeof record.scheduledDate === 'number') {
        record.scheduledDate = new Date((record.scheduledDate - 25569) * 86400 * 1000);
      } else if (typeof record.scheduledDate === 'string') {
        record.scheduledDate = new Date(record.scheduledDate);
      }

      if (isNaN(record.scheduledDate?.getTime())) {
        record.scheduledDate = new Date();
      }

      // Validate priority (1-5)
      if (record.priority < 1 || record.priority > 5) {
        record.priority = 2;
      }

      // Validate status
      const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(record.status)) {
        record.status = 'Scheduled';
      }

      validRecords.push(record);
    }

    return { validRecords, errors };
  }, []);

  const handleFileUploaded = useCallback(async (e) => {
    const file = e.value?.[0];
    if (!file) return;

    try {
      const rows = await parseExcelFile(file);
      const { validRecords, errors } = validateImportData(rows);

      setImportData(validRecords);
      setImportErrors(errors);

      if (validRecords.length === 0 && errors.length === 0) {
        notify('No data found in the file', 'warning', 3000);
      } else if (validRecords.length > 0) {
        notify(`Found ${validRecords.length} valid records`, 'success', 3000);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      notify('Error parsing file. Please ensure it is a valid Excel/CSV file.', 'error', 3000);
    }
  }, [parseExcelFile, validateImportData]);

  const handleConfirmImport = async () => {
    if (importData.length === 0) {
      notify('No valid records to import', 'warning', 3000);
      return;
    }

    setIsImporting(true);
    try {
      // Import records one by one or batch
      const results = await dispatch(importMaintenanceRecords(importData));

      if (results?.success) {
        notify(`Successfully imported ${results.imported || importData.length} maintenance records`, 'success', 4000);
        setShowImportPopup(false);
        dispatch(fetchMaintenanceRecords());
      } else {
        notify(results?.message || 'Import completed with some errors', 'warning', 4000);
      }
    } catch (error) {
      console.error('Error importing records:', error);
      notify('Error importing maintenance records', 'error', 3000);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Vehicle Number', 'Maintenance Type', 'Scheduled Date', 'Priority', 'Status', 'Description', 'Notes'],
      ['HYO-001', 'Oil Change', '2025-01-30', '2', 'Scheduled', 'Regular oil change', 'Use synthetic oil'],
      ['HYO-002', 'Tire Rotation', '2025-02-01', '3', 'Scheduled', 'Quarterly tire rotation', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Maintenance Import');
    XLSX.writeFile(wb, 'maintenance_import_template.xlsx');
  };

  const renderActionButtons = (cellData) => {
    return (
      <div className="tw-flex tw-gap-2">
        <Button
          icon="edit"
          onClick={() => handleEdit(cellData.data)}
          hint="Edit"
        />
        <Button
          icon="trash"
          onClick={() => handleDelete(cellData.data.maintenanceId)}
          hint="Delete"
        />
      </div>
    );
  };

  const renderStatusCell = (cellData) => {
    const statusColors = {
      Scheduled: "tw-bg-blue-100 tw-text-blue-800",
      "In Progress": "tw-bg-yellow-100 tw-text-yellow-800",
      Completed: "tw-bg-green-100 tw-text-green-800",
      Cancelled: "tw-bg-gray-100 tw-text-gray-800",
    };

    return (
      <span
        className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-semibold ${
          statusColors[cellData.value] || ""
        }`}
      >
        {cellData.value}
      </span>
    );
  };

  const renderPriorityCell = (cellData) => {
    const priorities = ["Low", "Normal", "Medium", "High", "Critical"];
    const priorityColors = [
      "tw-bg-gray-100 tw-text-gray-800",
      "tw-bg-blue-100 tw-text-blue-800",
      "tw-bg-yellow-100 tw-text-yellow-800",
      "tw-bg-orange-100 tw-text-orange-800",
      "tw-bg-red-100 tw-text-red-800",
    ];

    return (
      <span
        className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-semibold ${
          priorityColors[cellData.value - 1] || ""
        }`}
      >
        {priorities[cellData.value - 1] || cellData.value}
      </span>
    );
  };

  return (
    <div className="tw-h-full tw-flex tw-flex-col tw-p-4">
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-flex tw-flex-col tw-flex-1 tw-min-h-0">
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-border-b tw-border-gray-200 tw-flex-shrink-0">
          <div>
            <h2 className="tw-text-xl tw-font-bold tw-text-gray-800">
              Maintenance Records
            </h2>
            <p className="tw-text-gray-600 tw-text-sm">
              Manage all vehicle maintenance activities
            </p>
          </div>
          <div className="tw-flex tw-gap-2">
            <Button
              text="Import"
              icon="upload"
              stylingMode="outlined"
              onClick={handleImportClick}
              hint="Import from Excel/CSV"
            />
            <Button
              text="Add Maintenance"
              icon="add"
              type="success"
              onClick={handleAdd}
            />
          </div>
        </div>

        {/* Data Grid - Full Height */}
        <div className="tw-flex-1 tw-min-h-0 tw-p-4">
          <DataGrid
            dataSource={maintenanceRecords}
            keyExpr="maintenanceId"
            showBorders={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            allowColumnResizing={true}
            height="100%"
          >
            <Scrolling mode="virtual" />
            <SearchPanel visible={true} width={300} placeholder="Search..." />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Export enabled={true} fileName="maintenance_records" />
            <Selection mode="multiple" />
            <Paging defaultPageSize={50} />

            <Column dataField="vehicleName" caption="Vehicle" width={150} />
            <Column dataField="numberPlate" caption="Number Plate" width={120} />
            <Column dataField="maintenanceType" caption="Type" width={150} />
            <Column
              dataField="status"
              caption="Status"
              width={120}
              cellRender={renderStatusCell}
            />
            <Column
              dataField="priority"
              caption="Priority"
              width={100}
              cellRender={renderPriorityCell}
            />
            <Column
              dataField="scheduledDate"
              caption="Scheduled Date"
              width={120}
              dataType="date"
            />
            <Column
              dataField="completedDate"
              caption="Completed Date"
              width={120}
              dataType="date"
            />
            <Column
              caption="Actions"
              width={120}
              cellRender={renderActionButtons}
              allowSorting={false}
              allowFiltering={false}
            />
          </DataGrid>
        </div>

        {/* Add/Edit Popup - Full Screen & Mobile Friendly */}
        <Popup
          visible={showPopup}
          onHiding={() => setShowPopup(false)}
          title={
            editMode ? "Edit Maintenance Record" : "Add Maintenance Record"
          }
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
                    render={() => (
                      <div>
                        <Label text="Vehicle" />
                        <VehicleSearchableSelector
                          value={formData.vehicleId}
                          onValueChanged={handleVehicleChange}
                          placeholder="Search vehicle by number or name..."
                          width="100%"
                        />
                      </div>
                    )}
                  >
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

        {/* Import Popup */}
        <Popup
          visible={showImportPopup}
          onHiding={() => setShowImportPopup(false)}
          title="Import Maintenance Records"
          width={800}
          height={600}
          showCloseButton={true}
          closeOnOutsideClick={false}
        >
          <ScrollView width="100%" height="100%">
            <div className="tw-p-4">
              {/* Instructions */}
              <div className="tw-mb-6 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
                <div className="tw-flex tw-items-start">
                  <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3 tw-text-lg"></i>
                  <div>
                    <h4 className="tw-font-semibold tw-text-blue-800 tw-mb-2">Import Instructions</h4>
                    <ul className="tw-text-blue-700 tw-text-sm tw-space-y-1">
                      <li>• Upload an Excel (.xlsx, .xls) or CSV file</li>
                      <li>• Required column: <strong>Vehicle Number</strong> (Hyoung No)</li>
                      <li>• Optional columns: Maintenance Type, Scheduled Date, Priority (1-5), Status, Description, Notes</li>
                      <li>• First row should contain column headers</li>
                    </ul>
                    <Button
                      text="Download Template"
                      icon="download"
                      stylingMode="text"
                      onClick={downloadTemplate}
                      className="tw-mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* File Uploader */}
              <div className="tw-mb-4">
                <FileUploader
                  ref={fileUploaderRef}
                  selectButtonText="Select Excel/CSV File"
                  labelText="or Drop file here"
                  accept=".xlsx,.xls,.csv"
                  uploadMode="useForm"
                  onValueChanged={handleFileUploaded}
                  maxFileSize={10485760}
                />
              </div>

              {/* Validation Errors */}
              {importErrors.length > 0 && (
                <div className="tw-mb-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
                  <h4 className="tw-font-semibold tw-text-red-800 tw-mb-2">
                    <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                    Validation Errors ({importErrors.length})
                  </h4>
                  <ul className="tw-text-red-700 tw-text-sm tw-space-y-1 tw-max-h-32 tw-overflow-y-auto">
                    {importErrors.map((err, idx) => (
                      <li key={idx}>Row {err.row}: {err.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Data */}
              {importData.length > 0 && (
                <div className="tw-mb-4">
                  <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-2">
                    <i className="fa-light fa-check-circle tw-text-green-600 tw-mr-2"></i>
                    Valid Records Preview ({importData.length})
                  </h4>
                  <DataGrid
                    dataSource={importData.slice(0, 10)}
                    showBorders={true}
                    columnAutoWidth={true}
                    height={200}
                  >
                    <Column dataField="vehicleNumber" caption="Vehicle" />
                    <Column dataField="maintenanceType" caption="Type" />
                    <Column dataField="scheduledDate" caption="Date" dataType="date" />
                    <Column dataField="status" caption="Status" />
                    <Column dataField="priority" caption="Priority" />
                  </DataGrid>
                  {importData.length > 10 && (
                    <p className="tw-text-sm tw-text-gray-600 tw-mt-2">
                      Showing first 10 of {importData.length} records
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6">
                <Button
                  text="Cancel"
                  onClick={() => setShowImportPopup(false)}
                  stylingMode="outlined"
                />
                <Button
                  text={isImporting ? "Importing..." : `Import ${importData.length} Records`}
                  type="success"
                  onClick={handleConfirmImport}
                  disabled={importData.length === 0 || isImporting}
                />
              </div>
            </div>
          </ScrollView>
        </Popup>
      </div>
    </div>
  );
};

export default MaintenanceList;
