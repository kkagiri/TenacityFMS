import React, { useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Button from 'devextreme-react/button';
import FileUploader from 'devextreme-react/file-uploader';
import SelectBox from 'devextreme-react/select-box';
import LoadPanel from 'devextreme-react/load-panel';
import { ScrollView } from 'devextreme-react/scroll-view';
import { Popup } from 'devextreme-react/popup';
import notify from 'devextreme/ui/notify';
import ExcelPreviewGrid from './ExcelPreviewGrid';
import ValidationReportPanel from './ValidationReportPanel';
import axiosInstance from '../../../../../api/axiosInstance';
import { fetchSystemConfigurations } from '../../../../../redux/actions/systemConfigActions';
import './BulkImportManager.scss';

const BulkImportManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const configurations = useSelector(state => state.systemConfig?.configurations || []);

  // State management
  const [excelData, setExcelData] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState(0); // 0 = Skip, 1 = Replace
  const [uploadedFile, setUploadedFile] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importStats, setImportStats] = useState(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [enableAutoValidation, setEnableAutoValidation] = useState(false);
  const [fileUploaderKey, setFileUploaderKey] = useState(0);
  const fileUploaderRef = useRef(null);

  // Debug: Log state changes
  React.useEffect(() => {
    console.log('✅ ExcelData STATE updated:', excelData.length, 'rows', excelData.length > 0 ? '→ VALIDATE BUTTON SHOULD BE VISIBLE' : '→ No data');
  }, [excelData]);

  React.useEffect(() => {
    console.log('✅ ValidationResult STATE updated:', validationResult ? 'HAS VALIDATION RESULT → IMPORT BUTTON SHOULD BE VISIBLE' : 'NULL');
  }, [validationResult]);

  // Load configurations on mount
  React.useEffect(() => {
    dispatch(fetchSystemConfigurations({ category: 'BulkImport' }));
  }, [dispatch]);

  // Apply configurations when loaded
  React.useEffect(() => {
    if (configurations.length > 0) {
      configurations.forEach(config => {
        switch (config.configurationKey) {
          case 'TankStock.BulkImport.DefaultDuplicateHandling':
            const defaultMode = config.configurationValue === 'Replace' ? 1 : 0;
            setDuplicateHandling(defaultMode);
            break;
          case 'TankStock.BulkImport.EnableAutoValidation':
            setEnableAutoValidation(config.configurationValue === 'true');
            break;
          default:
            break;
        }
      });
    }
  }, [configurations]);

  const duplicateOptions = [
    { value: 0, text: 'Skip duplicates (keep existing)' },
    { value: 1, text: 'Replace duplicates (update existing)' }
  ];

  // Parse Excel file
  const parseExcelFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON with header mapping
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            dateNF: 'yyyy-mm-dd'
          });

          // Map Excel columns to DTO structure
          const mappedData = jsonData.map((row, index) => ({
            tankName: row['Tank Name'] || row['TankName'] || '',
            date: parseExcelDate(row['Date']),
            opening: parseNumber(row['Opening']),
            dispensing: parseNumber(row['Dispensing']),
            transferIn: parseNumber(row['Transfer IN'] || row['TransferIn']),
            transferOut: parseNumber(row['Transfer OUT'] || row['TransferOut']),
            delivery: parseNumber(row['Delivery']),
            closing: parseNumber(row['Closing']),
            openingMeter: parseNumber(row['Opening Meter'] || row['OpeningMeter']),
            closingMeter: parseNumber(row['Closing Meter'] || row['ClosingMeter']),
            notes: row['Notes'] || '',
            rowNumber: index + 2 // +2 because Excel is 1-indexed and has header row
          }));

          resolve(mappedData);
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Helper: Parse Excel date
  const parseExcelDate = (value) => {
    if (!value) return null;

    // If already a Date object
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    // If Excel serial number
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }

    // If string, try to parse
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed)) {
        return parsed.toISOString().split('T')[0];
      }
    }

    return value;
  };

  // Helper: Parse number
  const parseNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (e) => {
    console.log('File upload triggered:', e);
    const file = e.value[0];
    console.log('Selected file:', file);
    if (!file) return;

    try {
      setUploadedFile(file);
      setValidationResult(null);
      setImportSuccess(false);
      setImportStats(null);

      const parsedData = await parseExcelFile(file);
      console.log('Parsed data:', parsedData);
      setExcelData(parsedData);

      notify({
        message: `Successfully loaded ${parsedData.length} rows from ${file.name}`,
        type: 'success',
        displayTime: 3000
      });
    } catch (error) {
      console.error('Upload error:', error);
      notify({
        message: error.message,
        type: 'error',
        displayTime: 5000
      });
      setExcelData([]);
    }
  }, [parseExcelFile]);

  // Import data directly without validation
  const handleImport = useCallback(async () => {
    if (excelData.length === 0) {
      notify({
        message: 'No data to import',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    // Show confirmation popup
    setShowConfirmPopup(true);
  }, [excelData]);

  // Confirm and execute import
  const handleConfirmImport = useCallback(async () => {
    setShowConfirmPopup(false);
    setIsImporting(true);

    try {
      const response = await axiosInstance.post('/tankstock/bulk-import', {
        entries: excelData,
        validateOnly: false,
        duplicateHandling: duplicateHandling,
        ignoreWarnings: true,
        skipValidation: !enableAutoValidation // Pass config to backend
      });

      if (response.data.isSuccess) {
        const result = response.data.data;
        notify({
          message: `✓ Successfully imported ${result.importedRows} rows! Skipped: ${result.skippedRows}`,
          type: 'success',
          displayTime: 5000
        });

        // Set success state
        setImportSuccess(true);
        setImportStats(result);

        // Clear data and force FileUploader remount
        setExcelData([]);
        setValidationResult(null);
        setUploadedFile(null);

        // Force FileUploader to remount by changing key
        setFileUploaderKey(prev => prev + 1);
      } else {
        notify({
          message: response.data.message || 'Import failed',
          type: 'error',
          displayTime: 5000
        });
      }
    } catch (error) {
      notify({
        message: error.response?.data?.message || 'Import request failed',
        type: 'error',
        displayTime: 5000
      });
    } finally {
      setIsImporting(false);
    }
  }, [excelData, duplicateHandling, enableAutoValidation]);

  // Download template
  const handleDownloadTemplate = useCallback(() => {
    const templateData = [
      {
        'Tank Name': 'FT02',
        'Date': '2025-09-01',
        'Opening': 25400,
        'Dispensing': 1726,
        'Transfer IN': null,
        'Transfer OUT': null,
        'Delivery': null,
        'Closing': 23674,
        'Opening Meter': 2718366,
        'Closing Meter': 2723592,
        'Notes': 'Example row'
      },
      {
        'Tank Name': 'FT02',
        'Date': '2025-09-02',
        'Opening': 23674,
        'Dispensing': 1589,
        'Transfer IN': null,
        'Transfer OUT': null,
        'Delivery': null,
        'Closing': 22085,
        'Opening Meter': 2723592,
        'Closing Meter': 2728773,
        'Notes': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tank Stock Import');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Tank Name
      { wch: 12 }, // Date
      { wch: 10 }, // Opening
      { wch: 12 }, // Dispensing
      { wch: 12 }, // Transfer IN
      { wch: 12 }, // Transfer OUT
      { wch: 10 }, // Delivery
      { wch: 10 }, // Closing
      { wch: 14 }, // Opening Meter
      { wch: 14 }, // Closing Meter
      { wch: 20 }  // Notes
    ];

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'TankStock_BulkImport_Template.xlsx');

    notify({
      message: 'Template downloaded successfully',
      type: 'success',
      displayTime: 2000
    });
  }, []);

  // Clear all
  const handleClear = useCallback(() => {
    setExcelData([]);
    setValidationResult(null);
    setUploadedFile(null);
    setImportSuccess(false);
    setImportStats(null);

    // Force FileUploader to remount by changing key
    setFileUploaderKey(prev => prev + 1);

    notify({
      message: 'Form cleared',
      type: 'info',
      displayTime: 2000
    });
  }, []);

  const handleGoToAnalysis = useCallback(() => {
    navigate('/tankstock/stock-analytics');
  }, [navigate]);

  return (
    <div className="bulk-import-manager">
      {/* Confirmation Popup */}
      <Popup
        visible={showConfirmPopup}
        onHiding={() => setShowConfirmPopup(false)}
        dragEnabled={false}
        closeOnOutsideClick={false}
        showTitle={true}
        title="Confirm Import"
        width={500}
        height="auto"
      >
        <div className="tw-p-4">
          <div className="tw-flex tw-items-start tw-gap-3 tw-mb-4">
            <i className="fa-light fa-circle-info tw-text-blue-600 tw-text-3xl"></i>
            <div>
              <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-2">
                Ready to import {excelData.length} rows
              </h3>
              <div className="tw-space-y-1 tw-text-sm tw-text-gray-600">
                <p>
                  <span className="tw-font-medium">Duplicate handling:</span>{' '}
                  {duplicateHandling === 0 ? 'Skip existing entries (keep current data)' : 'Replace existing entries (overwrite current data)'}
                </p>
                <p>
                  <span className="tw-font-medium">Validation:</span>{' '}
                  {enableAutoValidation ? 'Enabled (backend will validate)' : 'Disabled (import directly)'}
                </p>
              </div>
            </div>
          </div>

          <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded tw-p-3 tw-mb-4">
            <p className="tw-text-sm tw-text-amber-800">
              <i className="fa-light fa-triangle-exclamation tw-mr-2"></i>
              This action cannot be undone. Make sure you have reviewed the data.
            </p>
          </div>

          <div className="tw-flex tw-justify-end tw-gap-2">
            <Button
              text="Cancel"
              onClick={() => setShowConfirmPopup(false)}
              stylingMode="outlined"
            />
            <Button
              text="Confirm Import"
              icon="fa-light fa-check"
              type="success"
              onClick={handleConfirmImport}
            />
          </div>
        </div>
      </Popup>

      <LoadPanel
        visible={isImporting}
        message="Importing data..."
        shading={true}
        showPane={true}
      />

      <ScrollView
        height="100%"
        width="100%"
        direction="vertical"
        showScrollbar="always"
      >
        {/* Header */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-6">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            <div>
              <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-3">
                <i className="fa-light fa-file-upload tw-text-blue-600"></i>
                Bulk Import Tank Stock Data
              </h2>
              <p className="tw-text-gray-600 tw-mt-2">
                Import historical tank stock data from Excel with comprehensive validation
              </p>
            </div>
            <Button
              text="Download Template"
              icon="fa-light fa-download"
              type="default"
              stylingMode="outlined"
              onClick={handleDownloadTemplate}
            />
          </div>

          {/* Instructions */}
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-blue-900 tw-mb-2 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-info-circle"></i>
              Quick Start
            </h3>
            <ol className="tw-list-decimal tw-list-inside tw-text-sm tw-text-blue-800 tw-space-y-1">
              <li>Download the Excel template above</li>
              <li>Fill in your tank stock data (Tank Name, Date, Opening, Closing, etc.)</li>
              <li>Upload the completed Excel file</li>
              <li>Choose duplicate handling strategy (skip or replace)</li>
              <li>Review the data preview</li>
              <li>Click "Import Data" to complete the import</li>
            </ol>
          </div>
        </div>

        {/* Success Message with Navigation */}
        {importSuccess && importStats && (
          <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-6 tw-mb-6 tw-shadow-sm">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-lg tw-font-bold tw-text-green-800 tw-flex tw-items-center tw-gap-2">
                  <i className="fa-light fa-check-circle tw-text-2xl"></i>
                  Import Successful
                </h3>
                <p className="tw-text-green-700 tw-mt-1">
                  Successfully imported {importStats.importedRows} rows. Skipped: {importStats.skippedRows}.
                </p>
                <p className="tw-text-sm tw-text-green-600 tw-mt-2">
                  You can now analyze the imported data for variances and discrepancies.
                </p>
              </div>
              <div className="tw-flex tw-gap-3">
                <Button
                  text="Import Another File"
                  icon="fa-light fa-plus"
                  type="normal"
                  stylingMode="outlined"
                  onClick={handleClear}
                />
                <Button
                  text="Go to Variance Analysis"
                  icon="fa-light fa-chart-mixed"
                  type="success"
                  onClick={handleGoToAnalysis}
                />
              </div>
            </div>
          </div>
        )}

      {/* Step 1: Upload File */}
      {!importSuccess && (
        <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <span className="tw-bg-blue-600 tw-text-white tw-rounded-full tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-text-sm">1</span>
            Upload Excel File
          </h3>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <FileUploader
                key={fileUploaderKey}
                ref={fileUploaderRef}
                selectButtonText="Choose Excel File"
                labelText="or drop file here"
                accept=".xlsx, .xls"
                uploadMode="useForm"
                multiple={false}
                onValueChanged={handleFileUpload}
              />
              {uploadedFile && (
                <div className="tw-mt-2 tw-text-sm tw-text-gray-600 tw-flex tw-items-center tw-gap-2">
                  <i className="fa-light fa-file-excel tw-text-green-600"></i>
                  <span>{uploadedFile.name}</span>
                  <span className="tw-text-gray-400">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Duplicate Handling
              </label>
              <SelectBox
                dataSource={duplicateOptions}
                displayExpr="text"
                valueExpr="value"
                value={duplicateHandling}
                onValueChanged={(e) => setDuplicateHandling(e.value)}
              />
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                How to handle entries that already exist in the database
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview Data & Import */}
      {excelData.length > 0 && !importSuccess && (
        <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-6">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
              <span className="tw-bg-blue-600 tw-text-white tw-rounded-full tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-text-sm">2</span>
              Review & Import Data ({excelData.length} rows)
            </h3>
            <div className="tw-flex tw-gap-2">
              <Button
                text="Import Data"
                icon="fa-light fa-upload"
                type="success"
                onClick={handleImport}
                disabled={isImporting}
              />
              <Button
                text="Clear"
                icon="fa-light fa-times"
                type="danger"
                stylingMode="outlined"
                onClick={handleClear}
              />
            </div>
          </div>

          {/* Duplicate Handling Info */}
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3 tw-mb-4">
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-blue-800">
              <i className="fa-light fa-info-circle"></i>
              <span className="tw-font-medium">Duplicate Handling:</span>
              <span>
                {duplicateHandling === 0
                  ? 'Duplicates will be skipped (existing data kept)'
                  : 'Duplicates will be replaced (existing data overwritten)'}
              </span>
            </div>
          </div>

          <ExcelPreviewGrid data={excelData} />
        </div>
      )}


      </ScrollView>
    </div>
  );
};

export default BulkImportManager;
