/**
 * File: JsReportViewer.js
 * Purpose: Report viewer with filter form and preview/download capabilities
 * Dependencies: React, DevExtreme, Redux, reportingService
 * Last Modified: 2026-01-23
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { LoadPanel } from 'devextreme-react/load-panel';
import { TabPanel, Item } from 'devextreme-react/tab-panel';
import notify from 'devextreme/ui/notify';
import reportingService from '../../../services/reportingService';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { fetchVehicleList } from '../../../redux/actions/vehicleActions';
import { fetchTanks } from '../../../redux/actions/tankActions';
import './JsReportViewer.scss';

const JsReportViewer = () => {
  const { reportType } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const iframeRef = useRef(null);

  // Redux state
  const { sites: reduxSites, loading: sitesLoading } = useSelector((state) => state.site || {});
  const { vehicles: reduxVehicles, loading: vehiclesLoading } = useSelector((state) => state.vehicle || {});
  const { tanks: reduxTanks, loading: tanksLoading } = useSelector((state) => state.tank || {});

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [outputFormat, setOutputFormat] = useState('html');
  const [previewHtml, setPreviewHtml] = useState('');
  const [lastGenerated, setLastGenerated] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)),
    dateTo: new Date(),
    siteId: null,
    vehicleId: null,
    tankId: null,
    fuelGradeId: null
  });

  // Process lookup data from Redux
  const sites = useMemo(() => {
    const siteArray = Array.isArray(reduxSites) ? reduxSites : [];
    return siteArray.map(s => ({
      id: s.siteId || s.id,
      name: s.siteName || s.name || `Site ${s.siteId || s.id}`
    }));
  }, [reduxSites]);

  const vehicles = useMemo(() => {
    const vehicleArray = Array.isArray(reduxVehicles) ? reduxVehicles : [];
    return vehicleArray.map(v => ({
      id: v.vehicleId || v.id,
      name: v.hyoungNo || v.name || v.vehicleName || `Vehicle ${v.vehicleId || v.id}`
    }));
  }, [reduxVehicles]);

  const tanks = useMemo(() => {
    const tankArray = Array.isArray(reduxTanks) ? reduxTanks : [];
    return tankArray.map(t => ({
      id: t.id || t.tankId,
      name: t.name || t.tankName || `Tank ${t.id || t.tankId}`,
      fuelGradeId: t.fuelGradeId,
      fuelGradeName: t.fuelGradeName,
      siteId: t.siteId
    }));
  }, [reduxTanks]);

  // Extract unique fuel grades from tanks
  const fuelGrades = useMemo(() => {
    const tankArray = Array.isArray(reduxTanks) ? reduxTanks : [];
    const gradeMap = new Map();

    tankArray.forEach(t => {
      if (t.fuelGradeId && t.fuelGradeName) {
        gradeMap.set(t.fuelGradeId, {
          id: t.fuelGradeId,
          name: t.fuelGradeName
        });
      }
    });

    return Array.from(gradeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [reduxTanks]);

  // Filter tanks by selected site
  const filteredTanks = useMemo(() => {
    if (!filters.siteId) return tanks;
    return tanks.filter(t => t.siteId === filters.siteId);
  }, [tanks, filters.siteId]);

  const outputFormats = [
    { value: 'html', text: 'HTML Preview' },
    { value: 'pdf', text: 'PDF Download' },
    { value: 'excel', text: 'Excel Download' }
  ];

  // Load initial data
  useEffect(() => {
    loadTemplates();
    loadLookupData();

    // Check for template from URL params
    const templateParam = searchParams.get('template');
    if (templateParam) {
      setSelectedTemplate(templateParam);
    }
  }, []);

  useEffect(() => {
    if (!previewHtml || !iframeRef.current) {
      return;
    }

    const iframe = iframeRef.current;
    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;

    if (!iframeDocument) {
      return;
    }

    iframeDocument.open();
    iframeDocument.write(previewHtml);
    iframeDocument.close();
  }, [previewHtml]);

  const loadTemplates = async () => {
    try {
      const result = await reportingService.getJsReportTemplates();
      if (result.success) {
        setTemplates(result.data || []);

        // Auto-select pump-transaction-report if available
        if (result.data?.includes('pump-transaction-report')) {
          setSelectedTemplate('pump-transaction-report');
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadLookupData = async () => {
    // Load data from Redux actions
    try {
      await Promise.all([
        dispatch(fetchSiteList()),
        dispatch(fetchVehicleList()),
        dispatch(fetchTanks())
      ]);
    } catch (error) {
      console.error('Error loading lookup data:', error);
      notify({ message: 'Error loading filter data', type: 'warning' });
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };

      // Clear tank selection when site changes
      if (field === 'siteId' && prev.tankId) {
        const tank = tanks.find(t => t.id === prev.tankId);
        if (tank && tank.siteId !== value) {
          newFilters.tankId = null;
        }
      }

      return newFilters;
    });
  };

  const generateReport = useCallback(async () => {
    if (!selectedTemplate) {
      notify({ message: 'Please select a report template', type: 'warning' });
      return;
    }

    setGenerating(true);
    try {
      // Build filter data
      const reportData = {
        dateFrom: filters.dateFrom?.toISOString().split('T')[0],
        dateTo: filters.dateTo?.toISOString().split('T')[0],
        siteId: filters.siteId,
        vehicleId: filters.vehicleId,
        tankId: filters.tankId,
        fuelGradeId: filters.fuelGradeId
      };

      let result;

      // Check if this is a pump transaction report
      if (selectedTemplate === 'pump-transaction-report') {
        // Use the dedicated pump transaction endpoint
        result = await reportingService.generatePumpTransactionReport({
          ...reportData,
          format: outputFormat
        });
      } else {
        // Use generic template rendering
        switch (outputFormat) {
          case 'pdf':
            result = await reportingService.renderJsReportPdf(selectedTemplate, reportData);
            break;
          case 'excel':
            result = await reportingService.renderJsReportExcel(selectedTemplate, reportData);
            break;
          default:
            result = await reportingService.previewJsReport(selectedTemplate, reportData);
        }
      }

      if (result.success) {
        if (outputFormat === 'html') {
          // Show preview in iframe
          setPreviewHtml(result.html);
        } else {
          // Download file
          reportingService.downloadReportFile(result.blob, result.fileName);
          notify({ message: `${outputFormat.toUpperCase()} downloaded successfully`, type: 'success' });
        }
        setLastGenerated(new Date());
      } else {
        notify({ message: result.error || 'Error generating report', type: 'error' });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      notify({ message: 'Error generating report', type: 'error' });
    } finally {
      setGenerating(false);
    }
  }, [selectedTemplate, outputFormat, filters]);

  const handlePrint = () => {
    const printWindow = iframeRef.current?.contentWindow;

    if (!previewHtml || !printWindow) {
      notify({ message: 'Generate the HTML preview before printing', type: 'warning' });
      return;
    }

    printWindow.focus();
    printWindow.print();
  };

  const handleRefresh = () => {
    generateReport();
  };

  const handleDownloadAs = async (format) => {
    if (!selectedTemplate) {
      notify({ message: 'Please select a report template', type: 'warning' });
      return;
    }

    setGenerating(true);
    try {
      const reportData = {
        dateFrom: filters.dateFrom?.toISOString().split('T')[0],
        dateTo: filters.dateTo?.toISOString().split('T')[0],
        siteId: filters.siteId,
        vehicleId: filters.vehicleId,
        tankId: filters.tankId,
        fuelGradeId: filters.fuelGradeId,
        format: format
      };

      let result;
      if (selectedTemplate === 'pump-transaction-report') {
        result = await reportingService.generatePumpTransactionReport(reportData);
      } else {
        result = format === 'pdf'
          ? await reportingService.renderJsReportPdf(selectedTemplate, reportData)
          : await reportingService.renderJsReportExcel(selectedTemplate, reportData);
      }

      if (result.success) {
        reportingService.downloadReportFile(result.blob, result.fileName);
        notify({ message: `${format.toUpperCase()} downloaded successfully`, type: 'success' });
      } else {
        notify({ message: result.error || 'Error downloading report', type: 'error' });
      }
    } catch (error) {
      notify({ message: 'Error downloading report', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const isDataLoading = sitesLoading || vehiclesLoading || tanksLoading;

  return (
    <div className="jsreport-viewer">
      <LoadPanel visible={loading || generating || isDataLoading} />

      {/* Header */}
      <div className="viewer-header">
        <div className="header-left">
          <i className="fa-light fa-file-chart-line tw-text-2xl tw-text-blue-600 tw-mr-3"></i>
          <div>
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">Report Viewer</h2>
            <p className="tw-text-sm tw-text-gray-500">Generate and view reports</p>
          </div>
        </div>
        <div className="header-right">
          {lastGenerated && (
            <span className="tw-text-sm tw-text-gray-500 tw-mr-4">
              Last generated: {lastGenerated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="viewer-content">
        {/* Filters Panel */}
        <div className="filters-panel">
          <div className="panel-header">
            <i className="fa-light fa-filter tw-mr-2"></i>
            Filters
          </div>
          <div className="filters-form">
            {/* Template Selection */}
            <div className="filter-group">
              <label>Report Template</label>
              <SelectBox
                value={selectedTemplate}
                dataSource={templates}
                onValueChanged={(e) => setSelectedTemplate(e.value)}
                placeholder="Select template..."
                searchEnabled={true}
                showClearButton={true}
              />
            </div>

            {/* Output Format */}
            <div className="filter-group">
              <label>Output Format</label>
              <SelectBox
                value={outputFormat}
                dataSource={outputFormats}
                valueExpr="value"
                displayExpr="text"
                onValueChanged={(e) => setOutputFormat(e.value)}
              />
            </div>

            {/* Date Range */}
            <div className="filter-group">
              <label>Date From</label>
              <DateBox
                value={filters.dateFrom}
                onValueChanged={(e) => handleFilterChange('dateFrom', e.value)}
                type="date"
                displayFormat="yyyy-MM-dd"
              />
            </div>

            <div className="filter-group">
              <label>Date To</label>
              <DateBox
                value={filters.dateTo}
                onValueChanged={(e) => handleFilterChange('dateTo', e.value)}
                type="date"
                displayFormat="yyyy-MM-dd"
              />
            </div>

            {/* Site Filter */}
            <div className="filter-group">
              <label>Site</label>
              <SelectBox
                value={filters.siteId}
                dataSource={sites}
                valueExpr="id"
                displayExpr="name"
                onValueChanged={(e) => handleFilterChange('siteId', e.value)}
                placeholder="All Sites"
                showClearButton={true}
                searchEnabled={true}
              />
            </div>

            {/* Vehicle Filter */}
            <div className="filter-group">
              <label>Vehicle</label>
              <SelectBox
                value={filters.vehicleId}
                dataSource={vehicles}
                valueExpr="id"
                displayExpr="name"
                onValueChanged={(e) => handleFilterChange('vehicleId', e.value)}
                placeholder="All Vehicles"
                showClearButton={true}
                searchEnabled={true}
              />
            </div>

            {/* Tank Filter */}
            <div className="filter-group">
              <label>Tank {filters.siteId && <span className="tw-text-xs tw-text-gray-400">(filtered by site)</span>}</label>
              <SelectBox
                value={filters.tankId}
                dataSource={filteredTanks}
                valueExpr="id"
                displayExpr="name"
                onValueChanged={(e) => handleFilterChange('tankId', e.value)}
                placeholder="All Tanks"
                showClearButton={true}
                searchEnabled={true}
              />
            </div>

            {/* Fuel Grade Filter */}
            <div className="filter-group">
              <label>Fuel Grade</label>
              <SelectBox
                value={filters.fuelGradeId}
                dataSource={fuelGrades}
                valueExpr="id"
                displayExpr="name"
                onValueChanged={(e) => handleFilterChange('fuelGradeId', e.value)}
                placeholder="All Fuel Grades"
                showClearButton={true}
                searchEnabled={true}
              />
            </div>

            {/* Generate Button */}
            <div className="filter-actions">
              <Button
                icon="fa-light fa-play"
                text="Generate Report"
                type="success"
                onClick={generateReport}
                disabled={generating || !selectedTemplate}
                width="100%"
              />
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="preview-panel">
          <div className="panel-header">
            <div className="header-left">
              <i className="fa-light fa-eye tw-mr-2"></i>
              Preview
              {selectedTemplate && (
                <span className="tw-text-gray-400 tw-ml-2 tw-font-normal">
                  — {selectedTemplate}
                </span>
              )}
            </div>
            <div className="header-actions">
              <Button
                icon="fa-light fa-refresh"
                hint="Refresh"
                onClick={handleRefresh}
                stylingMode="text"
                disabled={!selectedTemplate}
              />
              <Button
                icon="fa-light fa-print"
                text="Print PDF"
                hint="Print PDF"
                onClick={handlePrint}
                stylingMode="contained"
                type="default"
                elementAttr={{ class: 'preview-print-button' }}
                disabled={!previewHtml}
              />
              <Button
                icon="fa-light fa-file-pdf"
                text="PDF"
                onClick={() => handleDownloadAs('pdf')}
                stylingMode="text"
                disabled={!selectedTemplate}
              />
              <Button
                icon="fa-light fa-file-excel"
                text="Excel"
                onClick={() => handleDownloadAs('excel')}
                stylingMode="text"
                disabled={!selectedTemplate}
              />
            </div>
          </div>
          <div className="preview-content">
            {previewHtml ? (
              <iframe
                ref={iframeRef}
                title="Report Preview"
                className="preview-iframe"
              />
            ) : (
              <div className="preview-placeholder">
                <i className="fa-light fa-file-chart-line tw-text-6xl tw-text-gray-300 tw-mb-4"></i>
                <p className="tw-text-gray-500">
                  Select a template and click "Generate Report" to preview
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsReportViewer;
