/**
 * File: DataPreviewActions.js
 * Purpose: Action bar component with filter buttons and validation controls
 * Last Modified: 2025-12-16
 */
import React, { memo } from "react";
import { Form, Badge } from "react-bootstrap";
import Button from "devextreme-react/button";

/**
 * DataPreviewActions - Filter buttons, validation controls, and action buttons
 */
const DataPreviewActions = memo(
  ({
    reportType,
    validationErrors,
    filterErrorsOnly,
    setFilterErrorsOnly,
    showValidationErrors,
    handleToggleValidationFilter,
    showDuplicateErrors,
    handleToggleDuplicateFilter,
    onValidateData,
    selectValidRowsOnly,
  }) => {
    const hasBackendErrors = validationErrors.some((err) => err.isBackendError);
    const hasDuplicates = validationErrors.some((err) => err.isDuplicate);

    return (
      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-justify-between tw-items-center tw-gap-3">
        <div className="tw-flex tw-items-center tw-gap-3">
          {/* Validation Filter Button Group - Show for l/hr reports OR when backend errors exist */}
          {((reportType === "l/hr" && validationErrors.length > 0) ||
            hasBackendErrors) && (
            <div className="data-preview__filter-buttons">
              <Button
                text={filterErrorsOnly ? "Showing Issues" : "Show Issues"}
                icon="fa-light fa-triangle-exclamation"
                type="default"
                stylingMode="outlined"
                onClick={() => {
                  if (!filterErrorsOnly) {
                    setFilterErrorsOnly(true);
                    handleToggleValidationFilter({
                      target: { checked: true },
                    });
                  }
                }}
                hint="Filter to show only rows with validation issues"
                className={`data-preview__filter-btn data-preview__filter-btn--first ${
                  filterErrorsOnly ? "data-preview__filter-btn--active" : ""
                }`}
              />
              <Button
                text="Show All"
                icon="fa-light fa-list"
                type="default"
                stylingMode="outlined"
                onClick={() => {
                  setFilterErrorsOnly(false);
                  handleToggleValidationFilter({
                    target: { checked: false },
                  });
                }}
                hint="Show all rows"
                className={`data-preview__filter-btn data-preview__filter-btn--last ${
                  !filterErrorsOnly ? "data-preview__filter-btn--active" : ""
                }`}
              />
            </div>
          )}

          {/* Validation Issues Badge */}
          {validationErrors.length > 0 && (
            <span className="tw-bg-amber-100 tw-text-amber-800 tw-px-3 tw-py-1.5 tw-rounded-md tw-text-xs tw-font-semibold tw-flex tw-items-center tw-gap-1.5 tw-border tw-border-amber-200">
              <i className="fa-light fa-triangle-exclamation"></i>
              {validationErrors.length} validation issue
              {validationErrors.length !== 1 ? "s" : ""}
            </span>
          )}

          {/* Duplicates Filter - Only if duplicates exist */}
          {hasDuplicates && (
            <Button
              text={
                showDuplicateErrors ? "Showing Duplicates" : "Show Duplicates"
              }
              icon="fa-light fa-copy"
              type={showDuplicateErrors ? "danger" : "default"}
              stylingMode={showDuplicateErrors ? "contained" : "outlined"}
              onClick={() => {
                handleToggleDuplicateFilter({
                  target: { checked: !showDuplicateErrors },
                });
              }}
              hint="Filter to show only duplicate records"
              className="data-preview__duplicate-btn"
            />
          )}

          {/* km/l reports: Checkbox-based filters */}
          {reportType !== "l/hr" && validationErrors.length > 0 && (
            <>
              <Form.Check
                type="checkbox"
                id="validation-filter"
                label={
                  <span className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium">
                    <i
                      className={`fa-light fa-triangle-exclamation ${
                        showValidationErrors
                          ? "tw-text-red-500"
                          : "tw-text-amber-500"
                      }`}
                    ></i>
                    Show validation issues
                    <Badge bg="warning" className="tw-ml-1">
                      {validationErrors.length}
                    </Badge>
                  </span>
                }
                checked={showValidationErrors}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  handleToggleValidationFilter({
                    target: { checked: isChecked },
                  });
                }}
                className="tw-text-sm"
              />
              <Form.Check
                type="checkbox"
                id="filter-errors"
                label={
                  <span className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium">
                    <i
                      className={`fa-light ${
                        filterErrorsOnly
                          ? "fa-filter-circle-xmark tw-text-red-500"
                          : "fa-filter tw-text-gray-500"
                      }`}
                    ></i>
                    Filter rows with errors
                  </span>
                }
                checked={filterErrorsOnly}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setFilterErrorsOnly(isChecked);
                  if (isChecked && !showValidationErrors) {
                    handleToggleValidationFilter({
                      target: { checked: true },
                    });
                  }
                }}
                className="tw-text-sm"
              />
            </>
          )}
        </div>

        {/* Right side action buttons */}
        <div className="tw-flex tw-items-center tw-gap-2">
          {/* Validate Data Button - Re-run validation after edits */}
          {onValidateData && (
            <Button
              text="Validate Data"
              icon="fa-light fa-clipboard-check"
              type="default"
              stylingMode="outlined"
              onClick={onValidateData}
              hint="Re-validate data after making edits to check for remaining issues"
              className="data-preview__validate-btn"
            />
          )}
          {validationErrors.length > 0 && (
            <Button
              text="Select Valid Rows"
              icon="fa-light fa-filter-circle-check"
              type="default"
              stylingMode="outlined"
              onClick={selectValidRowsOnly}
              hint="Select only rows without validation errors"
              className="data-preview__select-valid-btn"
            />
          )}
        </div>
      </div>
    );
  }
);

DataPreviewActions.displayName = "DataPreviewActions";

export default DataPreviewActions;
