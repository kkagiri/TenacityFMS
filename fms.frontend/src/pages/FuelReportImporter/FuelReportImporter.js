/**
 * File: FuelReportImporter.js (SingleFileImporter)
 * Purpose: Single file import component for Fuel Report Import functionality
 *
 * This is the main component for importing a single Excel file at a time.
 * For batch importing multiple files, see ./components/batch/BatchImportPage.js
 *
 * Component Organization:
 * - Single file components: ./components/single/
 * - Batch import components: ./components/batch/
 * - Shared components: ./components/ (ImportResultDialog, ImportCalendarPopup)
 *
 * This component has been refactored to use specialized hooks:
 * - useImporterState: All state declarations
 * - useImportEffects: All useEffect hooks
 * - useImportHandlers: Handler functions
 * - useImportUtils: Import utility functions
 * - useDataProcessing: Data processing and validation
 * - useValidation: Grid validation and filtering
 *
 * @alias SingleFileImporter
 */

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card } from "react-bootstrap";
import ScrollView from "devextreme-react/scroll-view";
import { Toast } from "devextreme-react/toast";
import { Popup } from "devextreme-react/popup";

// Components - Single file importer
import ImportForm from "./components/single/ImportForm";
import ImportConfirmation from "./components/single/ImportConfirmation";
import ImportProgress from "./components/single/ImportProgress";
import SuccessAlert from "./components/single/SuccessAlert";
import ValidationAlerts from "./components/single/ValidationAlerts";
import DataPreview from "./components/DataPreview";
import SiteConfirmation from "./components/single/SiteConfirmation";
// Shared components
import ImportCalendarPopup from "./components/ImportCalendarPopup";
import ImportResultDialog from "./components/ImportResultDialog";

// Hooks
import useImporterState from "./hooks/useImporterState";
import useImportEffects from "./hooks/useImportEffects";
import useImportHandlers from "./hooks/useImportHandlers";
import useImportUtils from "./hooks/useImportUtils";
import useDataProcessing from "./hooks/useDataProcessing";
import useValidation from "./hooks/useValidation";

import "./FuelReportImporter.scss";

const reportTypes = [
  { value: "km/l", name: "km/l" },
  { value: "l/hr", name: "l/hr" },
];

const FuelReportImporter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const sites = useSelector((state) => state.site.sites);
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const {
    loading: fuelReportLoading,
    error: fuelReportError,
    success: fuelReportSuccess,
    reportId: uploadedReportId,
    importProgress,
  } = useSelector((state) => state.fuelReport);

  // All component state from custom hook
  const state = useImporterState();

  // Destructure commonly used state values
  const {
    selectedSite,
    setSelectedSite,
    reportType,
    setReportType,
    file,
    setFile,
    fileName,
    setFileName,
    skipRows,
    setSkipRows,
    clearAfterImport,
    setClearAfterImport,
    duplicateHandling,
    setDuplicateHandling,
    detectedSite,
    setDetectedSite,
    showSiteConfirmation,
    setShowSiteConfirmation,
    siteSelectionMode,
    setSiteSelectionMode,
    parsedData,
    setParsedData,
    filteredData,
    setFilteredData,
    validationErrors,
    setValidationErrors,
    dateRange,
    setDateRange,
    availableDates,
    setAvailableDates,
    toastVisible,
    setToastVisible,
    toastMessage,
    setToastMessage,
    toastType,
    setToastType,
    selectedRows,
    setSelectedRows,
    selectedRowKeys,
    setSelectedRowKeys,
    previewedOnce,
    setPreviewedOnce,
    showImportConfirmation,
    setShowImportConfirmation,
    showValidationErrors,
    setShowValidationErrors,
    showDuplicateErrors,
    setShowDuplicateErrors,
    showCalendarPopup,
    setShowCalendarPopup,
    showResultDialog,
    setShowResultDialog,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizes,
    importSuccessInfo,
    setImportSuccessInfo,
    importResult,
    setImportResult,
    filterErrorsOnly,
    setFilterErrorsOnly,
    hideProgressPanel,
    setHideProgressPanel,
    setHideLoadingPanel,
    fixedRows,
    setFixedRows,
    dataGridRef,
    fileInputRef,
    submittedDataMapRef,
  } = state;

  // Import utility hook
  const {
    showToast,
    handleFileChange,
    handlePreviewData,
    handleClearPreview,
    handlePrepareImport,
    handleSubmitData,
    handleRetryWithoutDuplicates,
    handleRetryWithOverwrite,
    findVehicleByName,
    findSiteByName,
  } = useImportUtils({
    sites,
    vehicles,
    skipRows,
    reportType,
    selectedSite,
    file,
    fileName,
    parsedData,
    setParsedData,
    filteredData,
    setFilteredData,
    validationErrors,
    setValidationErrors,
    setDateRange,
    setPreviewedOnce,
    setFile,
    setFileName,
    setSelectedSite,
    setReportType,
    setToastVisible,
    setToastMessage,
    setToastType,
    setShowImportConfirmation,
    setShowDuplicateErrors,
    setShowValidationErrors,
    fileInputRef,
    dispatch,
    duplicateHandling,
    clearAfterImport,
    fuelReportLoading,
    dataGridRef,
    selectedRowKeys,
    selectedRows,
    setDetectedSite,
    setShowSiteConfirmation,
    siteSelectionMode,
    setSiteSelectionMode,
    setFixedRows,
    submittedDataMapRef,
  });

  // Data processing hook
  const {
    validateData,
    getSelectedRowsCount,
    selectedRowsHaveErrors,
    countSelectedRowsErrors,
  } = useDataProcessing({
    parsedData,
    filteredData,
    selectedSite,
    sites,
    vehicles,
    skipRows,
    validationErrors,
    selectedRowKeys,
    findVehicleByName,
    findSiteByName,
  });

  // Grid validation hook
  const {
    onSelectionChanged,
    onRowPrepared,
    onCellClick,
    onEditorPreparing,
    onRowUpdated,
    cellRender,
    onPageChanged,
    onPageSizeChanged,
    clearSelections,
    handleToggleValidationFilter,
    handleToggleDuplicateFilter,
    selectValidRowsOnly,
    handleGridInitialized,
    getFilteredData,
  } = useValidation({
    dataGridRef,
    parsedData,
    validationErrors,
    setSelectedRowKeys,
    setSelectedRows,
    selectedRowKeys,
    setCurrentPage,
    setPageSize,
    setShowValidationErrors,
    setFilterErrorsOnly,
    setShowDuplicateErrors,
    setValidationErrors,
    setParsedData,
    showValidationErrors,
    showDuplicateErrors,
    filterErrorsOnly,
    vehicles,
    sites,
    reportType,
    filteredData,
    setShowPopover: state.setShowPopover,
    fixedRows,
    setFixedRows,
  });

  // Handler functions hook
  const {
    handleSiteConfirmation,
    handleDeleteSelectedRows,
    handleValidateData,
    handleGoToRow,
  } = useImportHandlers({
    parsedData,
    setParsedData,
    filteredData,
    validationErrors,
    setValidationErrors,
    selectedRowKeys,
    setSelectedRowKeys,
    selectedRows,
    setSelectedRows,
    selectedSite,
    setSelectedSite,
    fixedRows,
    setFixedRows,
    dataGridRef,
    showToast,
    handlePreviewData,
    validateData,
    setShowSiteConfirmation,
  });

  // Effects hook - handles all useEffect logic
  useImportEffects({
    dispatch,
    fuelReportError,
    fuelReportSuccess,
    fuelReportLoading,
    uploadedReportId,
    importProgress,
    parsedData,
    setParsedData,
    filteredData,
    setFilteredData,
    validationErrors,
    setValidationErrors,
    dateRange,
    availableDates,
    setAvailableDates,
    reportType,
    setSkipRows,
    setSelectedSite,
    clearAfterImport,
    showValidationErrors,
    setShowValidationErrors,
    showDuplicateErrors,
    setShowDuplicateErrors,
    filterErrorsOnly,
    setFilterErrorsOnly,
    setImportSuccessInfo,
    setImportResult,
    setShowResultDialog,
    setHideLoadingPanel,
    setHideProgressPanel,
    dataGridRef,
    submittedDataMapRef,
    showToast,
    handleClearPreview,
    clearSelections,
    setFile,
    setFileName,
    setPreviewedOnce,
  });

  return (
    <ScrollView className="view-wrapper-scroll">
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        displayTime={
          toastType === "error" || toastType === "warning" ? 6000 : 3000
        }
        onHiding={() => setToastVisible(false)}
        position={{ my: "top right", at: "top right", offset: "-10 10" }}
        width={400}
        height="auto"
        minHeight={50}
        contentComponent={(props) => {
          const { message } = props;
          return typeof message === "string" ? <div>{message}</div> : message;
        }}
      />

      <Popup
        visible={showImportConfirmation}
        onHiding={() => setShowImportConfirmation(false)}
        dragEnabled={false}
        showCloseButton={true}
        showTitle={true}
        title="Confirm Import"
        width={550}
        height="auto"
        className="tw-bg-white tw-shadow-xl tw-rounded-lg"
      >
        <ImportConfirmation
          duplicateHandling={duplicateHandling}
          setDuplicateHandling={setDuplicateHandling}
          clearAfterImport={clearAfterImport}
          setClearAfterImport={setClearAfterImport}
          setShowImportConfirmation={setShowImportConfirmation}
          handleSubmitData={handleSubmitData}
          fuelReportLoading={fuelReportLoading}
        />
      </Popup>

      <Card className="tw-shadow-lg tw-rounded-lg tw-mb-5">
        <Card.Header className="tw-bg-gray-50 tw-p-4 tw-border-b">
          <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
            <div className="tw-flex tw-items-center tw-gap-3">
              <i className="fa-light fa-file-import tw-text-xl tw-text-blue-600"></i>
              <h3 className="tw-text-xl tw-font-bold tw-m-0 tw-text-gray-800">
                Fuel Report Importer
              </h3>
            </div>
            <div className="tw-flex tw-gap-3 tw-ml-auto">
              <button
                className="tw-bg-green-500 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-green-600 tw-flex tw-items-center tw-gap-2 tw-border-0 tw-shadow-none tw-transition-colors"
                onClick={() => navigate("/reports/fuel-importer/batch")}
                title="Batch Import Multiple Files"
              >
                <i className="fa-light fa-files"></i>
                <span>Batch Import</span>
              </button>
              <button
                className="tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-blue-600 tw-flex tw-items-center tw-gap-2 tw-border-0 tw-shadow-none tw-transition-colors"
                onClick={() => setShowCalendarPopup(true)}
                title="View Import Calendar"
              >
                <i className="fa-light fa-calendar"></i>
                <span>Import Calendar</span>
              </button>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="tw-p-6">
          <ImportForm
            reportTypes={reportTypes}
            reportType={reportType}
            setReportType={setReportType}
            selectedSite={selectedSite}
            setSelectedSite={setSelectedSite}
            skipRows={skipRows}
            setSkipRows={setSkipRows}
            fileName={fileName}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            handleClearPreview={handleClearPreview}
            handlePreviewData={handlePreviewData}
            handlePrepareImport={handlePrepareImport}
            parsedData={parsedData}
            previewedOnce={previewedOnce}
            file={file}
            sites={sites}
            filteredData={filteredData}
            selectedRowsHaveErrors={selectedRowsHaveErrors}
            validationErrors={validationErrors}
            getSelectedRowsCount={getSelectedRowsCount}
            fuelReportLoading={fuelReportLoading}
            setFile={setFile}
            setFileName={setFileName}
            siteSelectionMode={siteSelectionMode}
            setSiteSelectionMode={setSiteSelectionMode}
          />

          {importProgress &&
            importProgress.inProgress &&
            !hideProgressPanel && (
              <ImportProgress
                importProgress={importProgress}
                setHideProgressPanel={setHideProgressPanel}
                handleRetryWithoutDuplicates={handleRetryWithoutDuplicates}
                handleRetryWithOverwrite={handleRetryWithOverwrite}
                fuelReportLoading={fuelReportLoading}
              />
            )}

          {importSuccessInfo && (
            <SuccessAlert
              importSuccessInfo={importSuccessInfo}
              setImportSuccessInfo={setImportSuccessInfo}
            />
          )}

          <ValidationAlerts
            validationErrors={validationErrors}
            fuelReportLoading={fuelReportLoading}
            showDuplicateErrors={showDuplicateErrors}
            onDismissValidation={() => setShowValidationErrors(false)}
            onDismissDuplicate={() => setShowDuplicateErrors(false)}
            onFilterBackendErrors={() => {
              setFilterErrorsOnly(true);
              setShowValidationErrors(true);
            }}
            onGoToRow={handleGoToRow}
          />

          {parsedData.length > 0 && (
            <DataPreview
              filteredData={filteredData}
              dataGridRef={dataGridRef}
              parsedData={parsedData}
              reportType={reportType}
              selectedRowKeys={selectedRowKeys}
              onSelectionChanged={onSelectionChanged}
              onRowPrepared={onRowPrepared}
              handleGridInitialized={handleGridInitialized}
              pageSize={pageSize}
              pageSizes={pageSizes}
              onPageChanged={onPageChanged}
              onPageSizeChanged={onPageSizeChanged}
              onCellClick={onCellClick}
              onEditorPreparing={onEditorPreparing}
              onRowUpdated={onRowUpdated}
              cellRender={cellRender}
              showValidationErrors={showValidationErrors}
              handleToggleValidationFilter={handleToggleValidationFilter}
              showDuplicateErrors={showDuplicateErrors}
              handleToggleDuplicateFilter={handleToggleDuplicateFilter}
              filterErrorsOnly={filterErrorsOnly}
              setFilterErrorsOnly={setFilterErrorsOnly}
              selectedRows={selectedRows}
              clearSelections={clearSelections}
              countSelectedRowsErrors={countSelectedRowsErrors}
              validationErrors={validationErrors}
              getFilteredData={getFilteredData}
              selectValidRowsOnly={selectValidRowsOnly}
              vehicles={vehicles}
              sites={sites}
              fixedRows={fixedRows}
              onDeleteSelectedRows={handleDeleteSelectedRows}
              onValidateData={handleValidateData}
            />
          )}

          <SiteConfirmation
            isVisible={showSiteConfirmation}
            onHide={() => setShowSiteConfirmation(false)}
            detectedSite={detectedSite}
            selectedSite={selectedSite}
            sites={sites}
            onConfirm={handleSiteConfirmation}
            onSiteChange={setSelectedSite}
            setSiteSelectionMode={setSiteSelectionMode}
          />

          <ImportCalendarPopup
            visible={showCalendarPopup}
            onHiding={() => setShowCalendarPopup(false)}
            sites={sites}
          />

          <ImportResultDialog
            visible={showResultDialog}
            onHiding={() => {
              setShowResultDialog(false);
              setImportResult(null);
            }}
            result={importResult}
            fileName={fileName}
            onRetryWithOverwrite={() => {
              setShowResultDialog(false);
              handleRetryWithOverwrite();
            }}
            onRetrySkipDuplicates={() => {
              setShowResultDialog(false);
              handleRetryWithoutDuplicates();
            }}
          />
        </Card.Body>
      </Card>
    </ScrollView>
  );
};

export default FuelReportImporter;
