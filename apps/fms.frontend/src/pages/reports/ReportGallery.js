import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextBox } from 'devextreme-react/text-box';
import { SelectBox } from 'devextreme-react/select-box';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import reportingService from '../../services/reportingService';
import './ReportGallery.scss';

/**
 * Report Gallery - Browse and access all available reports
 */
const ReportGallery = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [devExtremeReports, setDevExtremeReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Load reports and categories
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load all reports (built-in)
        const reportsResult = await reportingService.getReportDefinitions();
        if (reportsResult.success) {
          setReports(reportsResult.data);
        }

        // Load DevExtreme reports from database
        const devExtremeResult = await reportingService.getDevExtremeReports();
        if (devExtremeResult.success && devExtremeResult.data) {
          // Transform DevExtreme reports to match the report format
          // Now using real metadata from API
          const transformedReports = devExtremeResult.data.map(r => ({
            reportId: `devextreme-${r.id}`,
            reportName: r.displayName || r.name,
            description: r.description || `DevExtreme report: ${r.name}`,
            category: r.category || 'DevExtreme Reports',
            type: r.reportType ?? 4,
            icon: r.icon || 'fa-light fa-file-chart-column',
            isDevExtreme: true,
            devExtremeId: r.id,
            devExtremeName: r.name,
            createdAt: r.createdAt,
            createdBy: r.createdBy
          }));
          setDevExtremeReports(transformedReports);
        }

        // Load categories from both sources
        const categoriesResult = await reportingService.getReportCategories();
        const devExtremeCategoriesResult = await reportingService.getDevExtremeReportCategories();

        // Combine and dedupe categories
        const allCategories = new Set(['All']);
        if (categoriesResult.success && categoriesResult.data) {
          categoriesResult.data.forEach(c => allCategories.add(c.name));
        }
        if (devExtremeCategoriesResult.success && devExtremeCategoriesResult.data) {
          devExtremeCategoriesResult.data.forEach(c => allCategories.add(c.name));
        }

        setCategories([
          { name: 'All', icon: 'fa-light fa-list' },
          ...Array.from(allCategories)
            .filter(c => c !== 'All')
            .map(c => ({ name: c, icon: 'fa-light fa-folder' }))
        ]);
      } catch (error) {
        console.error('Error loading reports:', error);
        notify({ message: 'Error loading reports', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    // Combine built-in reports and DevExtreme reports
    let allReports = [...reports, ...devExtremeReports];
    let filtered = [...allReports];

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(r =>
        r.reportName.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.category.toLowerCase().includes(search)
      );
    }

    setFilteredReports(filtered);
  }, [reports, devExtremeReports, searchText, selectedCategory]);

  // Handle report selection
  const handleReportClick = (report) => {
    // Check if this is a DevExtreme report
    if (report.isDevExtreme) {
      // Navigate to DevExtreme Report Viewer
      navigate(`/reports/viewer/${encodeURIComponent(report.devExtremeName)}`);
      return;
    }

    // Navigate to the report page
    // You can define routes for each report type
    switch (report.reportId) {
      case 'tank-volume-history-report':
        navigate('/reports/tank-volume-history');
        break;
      case 'tank-volume-pivot-report':
        navigate('/tank-stock/reports'); // Use existing pivot report
        break;
      default:
        notify({ message: 'Report page not implemented yet', type: 'info' });
    }
  };

  // Handle edit DevExtreme report
  const handleEditDevExtremeReport = (e, report) => {
    e.stopPropagation();
    navigate(`/reports/designer/${encodeURIComponent(report.devExtremeName)}`);
  };

  // Handle create new DevExtreme report
  const handleCreateNewReport = () => {
    navigate('/reports/designer');
  };

  // Render report tile
  const renderReportTile = (report) => {
    const getReportTypeLabel = (type) => {
      switch (type) {
        case 0: return 'Data Grid';
        case 1: return 'Pivot Grid';
        case 2: return 'Chart';
        case 3: return 'Dashboard';
        case 4: return 'DevExtreme';
        default: return 'Report';
      }
    };

    const isDevExtreme = report.isDevExtreme;
    const headerGradient = isDevExtreme
      ? 'tw-from-purple-500 tw-to-purple-600'
      : 'tw-from-blue-500 tw-to-blue-600';

    return (
      <div className="report-tile tw-bg-white tw-rounded-lg tw-shadow-md hover:tw-shadow-xl tw-transition-shadow tw-cursor-pointer tw-overflow-hidden">
        <div className={`report-tile__header tw-bg-gradient-to-r ${headerGradient} tw-p-4 tw-text-white`}>
          <div className="tw-flex tw-items-center tw-justify-between">
            <i className={`${report.icon} tw-text-3xl`}></i>
            <span className="tw-text-xs tw-bg-white tw-bg-opacity-20 tw-px-2 tw-py-1 tw-rounded">
              {getReportTypeLabel(report.type)}
            </span>
          </div>
        </div>

        <div className="report-tile__body tw-p-4">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-2">
            {report.reportName}
          </h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mb-3 tw-line-clamp-2">
            {report.description}
          </p>

          <div className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-gray-500">
            <span className="tw-flex tw-items-center tw-gap-1">
              <i className="fa-light fa-folder"></i>
              {report.category}
            </span>
            <div className="tw-flex tw-items-center tw-gap-2">
              {isDevExtreme && (
                <button
                  className="tw-text-purple-600 hover:tw-text-purple-800 tw-font-medium"
                  onClick={(e) => handleEditDevExtremeReport(e, report)}
                  title="Edit Report"
                >
                  <i className="fa-light fa-pen-to-square"></i>
                </button>
              )}
              <button
                className="tw-text-blue-600 hover:tw-text-blue-800 tw-font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReportClick(report);
                }}
              >
                Open →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="report-gallery tw-flex tw-flex-col tw-h-full tw-p-4 tw-bg-gray-50">
      {/* Header */}
      <div className="report-gallery__header tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-mb-4">
        <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-start md:tw-items-center tw-justify-between tw-gap-4 tw-mb-4">
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-chart-mixed tw-text-blue-600"></i>
              Report Gallery
            </h2>
            <p className="tw-text-gray-600 tw-mt-1">
              Browse and access all available reports
            </p>
          </div>

          <div className="tw-flex tw-items-center tw-gap-4">
            <button
              onClick={handleCreateNewReport}
              className="tw-px-4 tw-py-2 tw-bg-green-500 tw-text-white tw-rounded-md hover:tw-bg-green-600 tw-flex tw-items-center tw-gap-2 tw-font-medium"
            >
              <i className="fa-light fa-plus"></i>
              Create Report
            </button>
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
              <i className="fa-light fa-file-chart-column"></i>
              <span>{filteredReports.length} reports available</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Search Reports
            </label>
            <TextBox
              value={searchText}
              onValueChanged={(e) => setSearchText(e.value)}
              placeholder="Search by name or description..."
              mode="search"
              width="100%"
            >
              <i className="fa-light fa-search" slot="before" />
            </TextBox>
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Category
            </label>
            <SelectBox
              dataSource={categories}
              displayExpr="name"
              valueExpr="name"
              value={selectedCategory}
              onValueChanged={(e) => setSelectedCategory(e.value)}
              placeholder="All Categories"
              showClearButton={true}
              width="100%"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="report-gallery__content tw-flex-1 tw-overflow-auto">
        {loading && (
          <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
            <LoadPanel visible={true} message="Loading reports..." />
          </div>
        )}

        {!loading && filteredReports.length === 0 && (
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-gray-500">
            <i className="fa-light fa-search tw-text-6xl tw-mb-4"></i>
            <h3 className="tw-text-xl tw-font-semibold tw-mb-2">No Reports Found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}

        {!loading && filteredReports.length > 0 && (
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.reportId}
                onClick={() => handleReportClick(report)}
              >
                {renderReportTile(report)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGallery;
