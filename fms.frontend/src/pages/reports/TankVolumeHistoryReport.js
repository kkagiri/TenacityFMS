import React, { useState, useEffect } from 'react';
import { ReportBuilder } from '../../components/Reporting';
import { DateBox } from 'devextreme-react/date-box';
import { SelectBox } from 'devextreme-react/select-box';
import { TagBox } from 'devextreme-react/tag-box';
import { CheckBox } from 'devextreme-react/check-box';
import { Button } from 'devextreme-react/button';
import reportingService from '../../services/reportingService';
import axios from '../../api/axiosInstance';
import notify from 'devextreme/ui/notify';
import './TankVolumeHistoryReport.scss';

/**
 * Tank Volume History Report - Example implementation using ReportBuilder
 */
const TankVolumeHistoryReport = () => {
  const [reportDefinition, setReportDefinition] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [selectedSites, setSelectedSites] = useState([]);
  const [selectedTanks, setSelectedTanks] = useState([]);
  const [selectedRecordedBy, setSelectedRecordedBy] = useState(null);
  const [includeVehicleNames, setIncludeVehicleNames] = useState(true);
  const [useManualDispensing, setUseManualDispensing] = useState(false);
  const [take, setTake] = useState(100);

  // Data sources for filters
  const [sites, setSites] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [users, setUsers] = useState([]);

  // Report filters (passed to ReportBuilder)
  const [reportFilters, setReportFilters] = useState(null);

  // Load report definition
  useEffect(() => {
    const loadReportDefinition = async () => {
      setLoading(true);
      try {
        const result = await reportingService.getReportDefinition('tank-volume-history-report');
        if (result.success) {
          setReportDefinition(result.data);
        } else {
          // Fallback to default configuration if backend not available
          console.warn('Using fallback report definition:', result.error);
          setReportDefinition(getDefaultReportDefinition());
        }
      } catch (error) {
        console.error('Error loading report definition, using fallback:', error);
        // Use fallback configuration
        setReportDefinition(getDefaultReportDefinition());
      } finally {
        setLoading(false);
      }
    };

    loadReportDefinition();
  }, []);

  // Default report definition (fallback when backend not available)
  const getDefaultReportDefinition = () => ({
    reportId: 'tank-volume-history-report',
    reportName: 'Tank Volume History',
    description: 'Detailed tank volume changes with filtering and grouping',
    icon: 'fa-light fa-gas-pump',
    type: 0, // DataGrid
    dataSourceEndpoint: '/TankVolumeHistory/filtered',
    columns: [
      { dataField: 'recordDate', caption: 'Date', dataType: 'datetime', format: 'MM/dd/yyyy HH:mm' },
      { dataField: 'siteName', caption: 'Site', dataType: 'string' },
      { dataField: 'tankName', caption: 'Tank', dataType: 'string' },
      { dataField: 'productName', caption: 'Product', dataType: 'string' },
      { dataField: 'openingVolume', caption: 'Opening', dataType: 'number', format: '#,##0.00' },
      { dataField: 'deliveries', caption: 'Deliveries', dataType: 'number', format: '#,##0.00' },
      { dataField: 'dispensed', caption: 'Dispensed', dataType: 'number', format: '#,##0.00' },
      { dataField: 'closingVolume', caption: 'Closing', dataType: 'number', format: '#,##0.00' },
      { dataField: 'variance', caption: 'Variance', dataType: 'number', format: '#,##0.00' },
      { dataField: 'recordedBy', caption: 'Recorded By', dataType: 'string' }
    ],
    defaultFilters: {},
    allowExport: true,
    showGroupPanel: true,
    allowGrouping: true
  });

  // Load filter data sources
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        // Load sites
        try {
          const sitesResponse = await axios.get('/Site');
          if (sitesResponse.data) {
            setSites(sitesResponse.data.map(s => ({ id: s.siteId, name: s.siteName })));
          }
        } catch (error) {
          console.warn('Error loading sites:', error);
        }

        // Load tanks
        try {
          const tanksResponse = await axios.get('/Tanks');
          if (tanksResponse.data) {
            setTanks(tanksResponse.data.map(t => ({ id: t.tankId, name: t.tankName, siteId: t.siteId })));
          }
        } catch (error) {
          console.warn('Error loading tanks:', error);
        }

        // Load users
        try {
          const usersResponse = await axios.get('/TankVolumeHistory/users');
          if (usersResponse.data) {
            setUsers(usersResponse.data);
          }
        } catch (error) {
          console.warn('Error loading users:', error);
        }
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };

    loadFilterData();
  }, []);

  // Build report filters
  const buildReportFilters = () => {
    const filters = {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      take,
      includeVehicleNames,
      useManualDispensing
    };

    if (selectedSites.length > 0) {
      filters.siteId = selectedSites[0]; // API supports single site
    }

    if (selectedTanks.length > 0) {
      filters.tankId = selectedTanks[0]; // API supports single tank
    }

    if (selectedRecordedBy) {
      filters.recordedBy = selectedRecordedBy;
    }

    return filters;
  };

  // Apply filters
  const handleApplyFilters = () => {
    const filters = buildReportFilters();
    setReportFilters(filters);
  };

  // Reset filters
  const handleResetFilters = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    setStartDate(date);
    setEndDate(new Date());
    setSelectedSites([]);
    setSelectedTanks([]);
    setSelectedRecordedBy(null);
    setIncludeVehicleNames(true);
    setUseManualDispensing(false);
    setTake(100);
    setReportFilters(null);
  };

  // Filter tanks by selected sites
  const filteredTanks = selectedSites.length > 0
    ? tanks.filter(t => selectedSites.includes(t.siteId))
    : tanks;

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
        <div className="tw-text-center">
          <i className="fa-light fa-hourglass tw-text-4xl tw-text-blue-600 tw-mb-3"></i>
          <p className="tw-text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tank-volume-history-report tw-flex tw-flex-col tw-h-full tw-p-4 tw-gap-4">
      {/* Filter Panel */}
      <div className="filter-panel tw-bg-white tw-rounded-lg tw-shadow tw-p-4">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
          <h4 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-filter"></i>
            Report Filters
          </h4>
          <div className="tw-flex tw-gap-2">
            <Button
              text="Reset"
              icon="fa-light fa-undo"
              type="normal"
              stylingMode="text"
              onClick={handleResetFilters}
            />
            <Button
              text="Apply Filters"
              icon="fa-light fa-check"
              type="default"
              stylingMode="contained"
              onClick={handleApplyFilters}
            />
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
          {/* Start Date */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Start Date
            </label>
            <DateBox
              value={startDate}
              onValueChanged={(e) => setStartDate(e.value)}
              displayFormat="MM/dd/yyyy"
              type="date"
              width="100%"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              End Date
            </label>
            <DateBox
              value={endDate}
              onValueChanged={(e) => setEndDate(e.value)}
              displayFormat="MM/dd/yyyy"
              type="date"
              width="100%"
            />
          </div>

          {/* Sites */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Site
            </label>
            <TagBox
              dataSource={sites}
              displayExpr="name"
              valueExpr="id"
              value={selectedSites}
              onValueChanged={(e) => setSelectedSites(e.value)}
              placeholder="Select sites..."
              searchEnabled={true}
              showSelectionControls={true}
              width="100%"
            />
          </div>

          {/* Tanks */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Tank
            </label>
            <TagBox
              dataSource={filteredTanks}
              displayExpr="name"
              valueExpr="id"
              value={selectedTanks}
              onValueChanged={(e) => setSelectedTanks(e.value)}
              placeholder="Select tanks..."
              searchEnabled={true}
              showSelectionControls={true}
              width="100%"
            />
          </div>

          {/* Recorded By */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Recorded By
            </label>
            <SelectBox
              dataSource={users}
              displayExpr="username"
              valueExpr="username"
              value={selectedRecordedBy}
              onValueChanged={(e) => setSelectedRecordedBy(e.value)}
              placeholder="Select user..."
              searchEnabled={true}
              showClearButton={true}
              width="100%"
            />
          </div>

          {/* Record Limit */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Record Limit
            </label>
            <SelectBox
              dataSource={[50, 100, 200, 500, 1000]}
              value={take}
              onValueChanged={(e) => setTake(e.value)}
              width="100%"
            />
          </div>

          {/* Include Vehicle Names */}
          <div className="tw-flex tw-items-end">
            <CheckBox
              text="Include Vehicle Names"
              value={includeVehicleNames}
              onValueChanged={(e) => setIncludeVehicleNames(e.value)}
            />
          </div>

          {/* Use Manual Dispensing */}
          <div className="tw-flex tw-items-end">
            <CheckBox
              text="Use Manual Dispensing"
              value={useManualDispensing}
              onValueChanged={(e) => setUseManualDispensing(e.value)}
            />
          </div>
        </div>
      </div>

      {/* Report */}
      <div className="report-content tw-flex-1" style={{ minHeight: 0 }}>
        {reportDefinition ? (
          <ReportBuilder
            reportDefinition={reportDefinition}
            filters={reportFilters}
            autoLoad={false}
          />
        ) : (
          <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-bg-gray-50 tw-rounded-lg">
            <div className="tw-text-center tw-text-gray-500">
              <i className="fa-light fa-file-chart-column tw-text-6xl tw-mb-4"></i>
              <p className="tw-text-lg">Loading report configuration...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TankVolumeHistoryReport;
