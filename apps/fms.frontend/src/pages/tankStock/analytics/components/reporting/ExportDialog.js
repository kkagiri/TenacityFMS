import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SelectBox } from 'devextreme-react/select-box';
import { TextBox } from 'devextreme-react/text-box';
import { CheckBox } from 'devextreme-react/check-box';
import { Button } from 'devextreme-react/button';
import './ExportDialog.scss';

const ExportDialog = ({ reportData, filters, reportType, onExport, onClose }) => {
  const [exportConfig, setExportConfig] = useState({
    format: 'PDF',
    reportType: reportType,
    startDate: filters.startDate,
    endDate: filters.endDate,
    siteIds: filters.siteIds,
    tankIds: filters.tankIds,
    changeReasons: filters.changeReasons,
    includeSummary: true,
    includeCharts: false,
    title: `Tank Volume History Report - ${reportType}`
  });

  const formatOptions = [
    { value: 'PDF', text: 'PDF Document' },
    { value: 'Excel', text: 'Excel Spreadsheet' }
  ];

  const handleConfigChange = useCallback((field, value) => {
    setExportConfig(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleExport = useCallback(() => {
    const exportRequest = {
      ...exportConfig,
      startDate: exportConfig.startDate.toISOString().split('T')[0],
      endDate: exportConfig.endDate.toISOString().split('T')[0]
    };

    onExport(exportRequest);
    onClose();
  }, [exportConfig, onExport, onClose]);

  const getPreviewText = () => {
    const recordCount = reportData?.data?.length || 0;
    const sites = reportData?.summary?.sitesIncluded?.length || 0;
    const tanks = reportData?.summary?.tanksIncluded?.length || 0;

    return `This export will include ${recordCount} records across ${sites} sites and ${tanks} tanks.`;
  };

  return (
    <div className="export-dialog tw-p-4">
      {/* Export Format */}
      <div className="tw-mb-4">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Export Format
        </label>
        <SelectBox
          dataSource={formatOptions}
          valueExpr="value"
          displayExpr="text"
          value={exportConfig.format}
          onValueChanged={(e) => handleConfigChange('format', e.value)}
          width="100%"
        />
      </div>

      {/* Report Title */}
      <div className="tw-mb-4">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Report Title
        </label>
        <TextBox
          value={exportConfig.title}
          onValueChanged={(e) => handleConfigChange('title', e.value)}
          placeholder="Enter report title..."
          width="100%"
        />
      </div>

      {/* Export Options */}
      <div className="tw-mb-4">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Export Options
        </label>
        <div className="tw-space-y-2">
          <CheckBox
            value={exportConfig.includeSummary}
            onValueChanged={(e) => handleConfigChange('includeSummary', e.value)}
            text="Include summary statistics"
          />
          <CheckBox
            value={exportConfig.includeCharts}
            onValueChanged={(e) => handleConfigChange('includeCharts', e.value)}
            text="Include charts and visualizations"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="tw-mb-6 tw-p-3 tw-bg-gray-50 tw-rounded tw-border">
        <h4 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Export Preview</h4>
        <p className="tw-text-sm tw-text-gray-600">{getPreviewText()}</p>
        <div className="tw-mt-2 tw-text-xs tw-text-gray-500">
          Date Range: {filters.startDate?.toLocaleDateString()} - {filters.endDate?.toLocaleDateString()}
        </div>
      </div>

      {/* Note for PDF/Excel limitations */}
      <div className="tw-mb-6 tw-p-3 tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded">
        <div className="tw-flex tw-items-start">
          <i className="fa-light fa-info-circle tw-text-yellow-600 tw-mt-1 tw-mr-2"></i>
          <div>
            <h4 className="tw-text-sm tw-font-medium tw-text-yellow-800">Export Functionality Note</h4>
            <p className="tw-text-xs tw-text-yellow-700 tw-mt-1">
              Export functionality is currently in development. This will generate export requests that can be processed by the backend service.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="tw-flex tw-justify-end tw-gap-3">
        <Button
          text="Cancel"
          type="normal"
          onClick={onClose}
        />
        <Button
          text={`Export as ${exportConfig.format}`}
          type="default"
          onClick={handleExport}
          disabled={!reportData?.data?.length}
        />
      </div>
    </div>
  );
};

ExportDialog.propTypes = {
  reportData: PropTypes.object,
  filters: PropTypes.object.isRequired,
  reportType: PropTypes.string.isRequired,
  onExport: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ExportDialog;
