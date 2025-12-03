/**
 * File: ImportForm.js
 * Purpose: Form component for fuel report import with file selection and action buttons
 * Dependencies: react-bootstrap, devextreme-react/button
 * Last Modified: 2025-12-01
 */
import React from "react";
import { Form } from "react-bootstrap";
import Button from "devextreme-react/button";
import "./ImportForm.scss";

const ImportForm = ({
  reportTypes,
  reportType,
  setReportType,
  selectedSite,
  setSelectedSite,
  skipRows,
  setSkipRows,
  fileName,
  fileInputRef,
  handleFileChange,
  handleClearPreview,
  handlePreviewData,
  handlePrepareImport,
  parsedData,
  previewedOnce,
  file,
  sites,
  filteredData,
  selectedRowsHaveErrors,
  validationErrors,
  getSelectedRowsCount,
  fuelReportLoading,
  setFile,
  setFileName,
  siteSelectionMode, //Cursor
  setSiteSelectionMode, //Cursor
}) => {
  return (
    <Form className="tw-rounded-md">
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-mb-6">
        <Form.Group>
          <Form.Label className="tw-font-medium tw-text-gray-700 tw-block tw-mb-2">
            <i className="fa-light fa-file-chart-column tw-mr-2 tw-text-gray-500"></i>
            Report Type
          </Form.Label>
          <Form.Control
            as="select"
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              handleClearPreview();
            }}
            required
            className="tw-w-full tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-blue-500 focus:tw-border-blue-500"
          >
            <option value="">Select Report Type</option>
            {reportTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        {reportType === "km/l" && (
          <Form.Group>
            <Form.Label className="tw-font-medium tw-text-gray-700 tw-block tw-mb-2">
              <i className="fa-light fa-building tw-mr-2"></i>Site Selection
            </Form.Label>
            <div className="tw-mb-2">
              <Form.Check
                type="radio"
                id="auto-detect"
                name="siteSelectionMode"
                label={
                  <span className="tw-flex tw-items-center">
                    <i className="fa-light fa-wand-magic-sparkles tw-mr-2 tw-text-blue-500"></i>
                    Detect from filename
                  </span>
                }
                checked={siteSelectionMode === "auto"}
                onChange={() => setSiteSelectionMode("auto")}
                className="tw-mb-1"
              />
              <Form.Check
                type="radio"
                id="manual-select"
                name="siteSelectionMode"
                label={
                  <span className="tw-flex tw-items-center">
                    <i className="fa-light fa-hand-point-up tw-mr-2 tw-text-blue-500"></i>
                    Select manually
                  </span>
                }
                checked={siteSelectionMode === "manual"}
                onChange={() => setSiteSelectionMode("manual")}
              />
            </div>
            {siteSelectionMode === "manual" && (
              <Form.Control
                as="select"
                value={selectedSite}
                onChange={(e) => {
                  setSelectedSite(e.target.value);
                }}
                required
                className="tw-w-full tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-blue-500 focus:tw-border-blue-500"
              >
                <option value="">Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </Form.Control>
            )}
            {siteSelectionMode === "auto" && !selectedSite && (
              <div className="tw-text-sm tw-text-gray-600 tw-bg-blue-50 tw-p-2 tw-rounded tw-border tw-border-blue-100">
                <i className="fa-light fa-info-circle tw-mr-1 tw-text-blue-500"></i>
                Site will be detected from the filename when a file is uploaded.
              </div>
            )}
            {siteSelectionMode === "auto" && selectedSite && (
              <Form.Control
                as="select"
                value={selectedSite}
                onChange={(e) => {
                  setSelectedSite(e.target.value);
                }}
                required
                className="tw-w-full tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-blue-500 focus:tw-border-blue-500"
              >
                <option value="">Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </Form.Control>
            )}
          </Form.Group>
        )}

        <Form.Group>
          <Form.Label className="tw-font-medium tw-text-gray-700 tw-block tw-mb-2">
            <i className="fa-light fa-arrows-down-to-line tw-mr-2 tw-text-gray-500"></i>
            Skip Rows (Header)
          </Form.Label>
          <Form.Control
            type="number"
            value={skipRows === null ? "" : skipRows}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setSkipRows(isNaN(value) ? null : Math.max(0, value));
            }}
            min="0"
            placeholder="e.g., 8"
            className="tw-w-full tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-blue-500 focus:tw-border-blue-500"
          />
        </Form.Group>
      </div>

      <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-end tw-gap-4 tw-mb-6">
        <Form.Group className="tw-flex-grow">
          <Form.Label className="tw-font-medium tw-text-gray-700 tw-block tw-mb-2">
            <i className="fa-light fa-upload tw-mr-2 tw-text-gray-500"></i>
            Upload Excel File (.xlsx)
          </Form.Label>
          <div className="tw-flex tw-items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="tw-hidden"
              id="fuel-report-file-input"
            />
            <Button
              stylingMode="outlined"
              type="normal"
              text={fileName || "Choose File..."}
              onClick={() => fileInputRef.current?.click()}
              icon="file"
              disabled={!reportType || (reportType === "km/l" && siteSelectionMode === "manual" && !selectedSite)}
              elementAttr={{
                class: `tw-border tw-border-gray-300 tw-rounded-md ${
                  !reportType || (reportType === "km/l" && siteSelectionMode === "manual" && !selectedSite)
                    ? "tw-opacity-50 tw-cursor-not-allowed"
                    : ""
                }`,
                title: !reportType
                  ? "Select report type before choosing a file"
                  : reportType === "km/l" && siteSelectionMode === "manual" && !selectedSite
                  ? "Select a site before choosing a file"
                  : undefined,
              }}
            />
            {fileName && (
              <Button
                stylingMode="text"
                type="normal"
                icon="clear"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = null;
                  }
                  setFile(null);
                  setFileName("");
                  handleClearPreview();
                }}
                elementAttr={{
                  class: "tw-ml-2 tw-text-red-500 hover:tw-text-red-700",
                  title: "Clear selected file",
                }}
              />
            )}
          </div>
        </Form.Group>

        {/* Action Buttons - Segmented Group Style */}
        <div className="fuel-import__action-buttons">
          {/* Toggle Button: Preview Data / Clear Preview */}
          <Button
            text={parsedData.length > 0 ? "Clear Preview" : "Preview Data"}
            icon={parsedData.length > 0 ? "fa-light fa-trash" : "fa-light fa-eye"}
            type="default"
            stylingMode="outlined"
            onClick={parsedData.length > 0 ? handleClearPreview : handlePreviewData}
            disabled={
              parsedData.length === 0
                ? (!file ||
              !reportType ||
              (reportType === "km/l" && siteSelectionMode === "manual" && !selectedSite) ||
                   fuelReportLoading)
                : false
            }
            hint={parsedData.length > 0 ? "Clear the preview data" : "Preview data from the Excel file"}
            className={`fuel-import__action-btn fuel-import__action-btn--first ${
              parsedData.length > 0
                ? "fuel-import__action-btn--clear-active"
                : "fuel-import__action-btn--preview"
            } ${parsedData.length === 0 ? "fuel-import__action-btn--last" : ""}`}
          />
          {/* Import Button - Only shows after preview */}
          {parsedData.length > 0 && (
              <Button
                text={
                  getSelectedRowsCount() > 0
                    ? `Import ${getSelectedRowsCount()} Selected`
                    : `Import ${filteredData.length} Grid Rows`
                }
              icon="fa-light fa-upload"
              type="default"
              stylingMode="outlined"
                onClick={handlePrepareImport}
                disabled={
                  !previewedOnce ||
                  filteredData.length === 0 ||
                  fuelReportLoading ||
                  (getSelectedRowsCount() > 0
                    ? selectedRowsHaveErrors()
                    : validationErrors.length > 0)
                }
              hint={
                    getSelectedRowsCount() > 0 && selectedRowsHaveErrors()
                      ? "Selected rows contain validation errors"
                  : validationErrors.length > 0 && getSelectedRowsCount() === 0
                      ? "Fix validation errors before importing"
                  : "Import data to the system"
              }
              className="fuel-import__action-btn fuel-import__action-btn--last fuel-import__action-btn--import"
              />
          )}
        </div>
      </div>
    </Form>
  );
};

export default ImportForm;
