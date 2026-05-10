/**
 * File: SystemConfigImport.js
 * Purpose: Bulk import system configurations via JSON/CSV inside a SlidePanel.
 * Dependencies: react, prop-types, redux, devextreme-react controls, SlidePanel
 * Last Modified: 2026-03-03
 *
 * Key Functions:
 * - parseImportFile(): Parses JSON/CSV import content
 * - validateImportData(): Validates required fields and value constraints
 * - handleImport(): Imports each row and reports progress/results
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import Button from 'devextreme-react/button';
import FileUploader from 'devextreme-react/file-uploader';
import ProgressBar from 'devextreme-react/progress-bar';
import notify from 'devextreme/ui/notify';
import SlidePanel from '../../../../components/ui/SlidePanel';

import { createSystemConfiguration } from '../../../../redux/actions/systemConfigActions';

const SystemConfigImport = ({ visible, onClose, onImportComplete }) => {
  const dispatch = useDispatch();
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);

  const handleFileSelected = (e) => {
    const file = e.value[0];
    if (file) {
      setImportFile(file);
      setImportResults(null);
    }
  };

  const validateImportData = (data) => {
    const errors = [];
    const validDataTypes = ['String', 'Integer', 'Decimal', 'Boolean', 'DateTime', 'Json', 'Url', 'Email', 'Password'];

    data.forEach((item, index) => {
      const rowNum = index + 1;

      if (!item.configurationKey || typeof item.configurationKey !== 'string') {
        errors.push(`Row ${rowNum}: Configuration key is required and must be a string`);
      }

      if (!item.configurationValue || typeof item.configurationValue !== 'string') {
        errors.push(`Row ${rowNum}: Configuration value is required and must be a string`);
      }

      if (item.dataType && !validDataTypes.includes(item.dataType)) {
        errors.push(`Row ${rowNum}: Invalid data type. Must be one of: ${validDataTypes.join(', ')}`);
      }

      if (item.configurationKey && item.configurationKey.length > 255) {
        errors.push(`Row ${rowNum}: Configuration key must be 255 characters or less`);
      }

      if (item.configurationValue && item.configurationValue.length > 1000) {
        errors.push(`Row ${rowNum}: Configuration value must be 1000 characters or less`);
      }

      if (item.description && item.description.length > 500) {
        errors.push(`Row ${rowNum}: Description must be 500 characters or less`);
      }
    });

    return errors;
  };

  const parseImportFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target.result;
          let data;

          if (file.name.endsWith('.json')) {
            data = JSON.parse(content);
          } else if (file.name.endsWith('.csv')) {
            // Simple CSV parser - in production, consider using a proper CSV library
            const lines = content.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

            data = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = values[index] || '';
              });
              return obj;
            });
          } else {
            throw new Error('Unsupported file format. Please use JSON or CSV files.');
          }

          if (!Array.isArray(data)) {
            throw new Error('Import data must be an array of configuration objects');
          }

          resolve(data);
        } catch (error) {
          reject(new Error(`Failed to parse file: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  };

  const handleImport = async () => {
    if (!importFile) {
      notify('Please select a file to import', 'warning', 3000);
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);

    try {
      // Parse the file
      setImportProgress(10);
      const importData = await parseImportFile(importFile);

      // Validate the data
      setImportProgress(20);
      const validationErrors = validateImportData(importData);

      if (validationErrors.length > 0) {
        throw new Error(`Validation failed:\n${validationErrors.join('\n')}`);
      }

      // Import configurations
      const results = {
        total: importData.length,
        success: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < importData.length; i++) {
        try {
          const config = {
            configurationKey: importData[i].configurationKey,
            configurationValue: importData[i].configurationValue,
            description: importData[i].description || '',
            dataType: importData[i].dataType || 'String',
            category: importData[i].category || 'General',
            isActive: importData[i].isActive !== undefined ? importData[i].isActive : true,
            isEditable: importData[i].isEditable !== undefined ? importData[i].isEditable : true,
            validationPattern: importData[i].validationPattern || '',
            defaultValue: importData[i].defaultValue || '',
            minValue: importData[i].minValue || null,
            maxValue: importData[i].maxValue || null,
            possibleValues: importData[i].possibleValues || ''
          };

          await dispatch(createSystemConfiguration(config));
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: ${error.message}`);
        }

        // Update progress
        setImportProgress(20 + ((i + 1) / importData.length) * 80);
      }

      setImportResults(results);

      if (results.success > 0) {
        notify(`Successfully imported ${results.success} configuration(s)`, 'success', 3000);
        if (typeof onImportComplete === 'function') {
          onImportComplete();
        }
      }

      if (results.failed > 0) {
        notify(`Failed to import ${results.failed} configuration(s). Check results for details.`, 'warning', 5000);
      }

    } catch (error) {
      notify(`Import failed: ${error.message}`, 'error', 5000);
      setImportResults({
        total: 0,
        success: 0,
        failed: 0,
        errors: [error.message]
      });
    } finally {
      setIsImporting(false);
      setImportProgress(100);
    }
  };

  const handleClose = () => {
    setImportFile(null);
    setImportProgress(0);
    setImportResults(null);
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        configurationKey: "Example.Setting1",
        configurationValue: "value1",
        description: "Example configuration setting",
        dataType: "String",
        category: "General",
        isActive: true,
        isEditable: true,
        validationPattern: "",
        defaultValue: "",
        minValue: null,
        maxValue: null,
        possibleValues: ""
      },
      {
        configurationKey: "Example.Setting2",
        configurationValue: "123",
        description: "Example numeric setting",
        dataType: "Integer",
        category: "System",
        isActive: true,
        isEditable: true,
        validationPattern: "",
        defaultValue: "0",
        minValue: 0,
        maxValue: 1000,
        possibleValues: ""
      }
    ];

    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'system-config-template.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <SlidePanel
      open={visible}
      onClose={handleClose}
      title="Import System Configurations"
      width={620}
    >
      <div className="system-config-import-panel tw-p-6">
        {/* Instructions */}
        <div className="m365-section tw-mb-6">
          <h4 className="tw-font-semibold tw-text-gray-900 tw-mb-2">Import Instructions</h4>
          <ul className="tw-text-sm tw-text-gray-600 tw-list-disc tw-list-inside tw-space-y-1">
            <li>Upload a JSON or CSV file containing configuration data</li>
            <li>Required fields: configurationKey, configurationValue</li>
            <li>Optional fields: description, dataType, category, isActive, isEditable</li>
            <li>Download the template below for the correct format</li>
          </ul>

          <div className="tw-mt-3">
            <Button
              text="Download Template"
              type="normal"
              icon="fa fa-download"
              onClick={downloadTemplate}
            />
          </div>
        </div>

        {/* File Upload */}
        <div className="m365-section tw-mb-6">
          <h4 className="tw-font-semibold tw-text-gray-900 tw-mb-2">Select File</h4>
          <FileUploader
            selectButtonText="Choose File"
            labelText="Drop file here or click to browse"
            accept=".json,.csv"
            uploadMode="useButtons"
            multiple={false}
            onValueChanged={handleFileSelected}
            disabled={isImporting}
          />
          {importFile && (
            <div className="tw-mt-2 tw-text-sm tw-text-green-600">
              <i className="fa fa-file tw-mr-1"></i>
              Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Progress */}
        {isImporting && (
          <div className="m365-section tw-mb-6">
            <h4 className="tw-font-semibold tw-text-gray-900 tw-mb-2">Import Progress</h4>
            <ProgressBar value={importProgress} showStatus={true} />
          </div>
        )}

        {/* Results */}
        {importResults && (
          <div className="m365-section tw-mb-6">
            <h4 className="tw-font-semibold tw-text-gray-900 tw-mb-2">Import Results</h4>
            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
              <div className="tw-grid tw-grid-cols-3 tw-gap-4 tw-mb-4">
                <div className="tw-text-center">
                  <div className="tw-text-2xl tw-font-bold tw-text-blue-600">{importResults.total}</div>
                  <div className="tw-text-sm tw-text-gray-600">Total</div>
                </div>
                <div className="tw-text-center">
                  <div className="tw-text-2xl tw-font-bold tw-text-green-600">{importResults.success}</div>
                  <div className="tw-text-sm tw-text-gray-600">Success</div>
                </div>
                <div className="tw-text-center">
                  <div className="tw-text-2xl tw-font-bold tw-text-red-600">{importResults.failed}</div>
                  <div className="tw-text-sm tw-text-gray-600">Failed</div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="tw-max-h-32 tw-overflow-y-auto">
                  <h5 className="tw-font-medium tw-text-red-800 tw-mb-2">Errors:</h5>
                  <ul className="tw-text-sm tw-text-red-700 tw-space-y-1">
                    {importResults.errors.map((error, index) => (
                      <li key={index} className="tw-break-words">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-space-x-3">
          <Button
            text="Cancel"
            type="normal"
            onClick={handleClose}
            disabled={isImporting}
          />
          <Button
            text={isImporting ? "Importing..." : "Import Configurations"}
            type="success"
            onClick={handleImport}
            disabled={!importFile || isImporting}
            icon={isImporting ? "fa fa-spinner fa-spin" : "fa fa-upload"}
          />
        </div>
      </div>
    </SlidePanel>
  );
};

SystemConfigImport.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onImportComplete: PropTypes.func.isRequired
};

SystemConfigImport.defaultProps = {
  onClose: () => {},
  onImportComplete: () => {}
};

export default SystemConfigImport;
