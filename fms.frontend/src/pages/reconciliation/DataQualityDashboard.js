import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateBox, Button } from 'devextreme-react';
import { Chart, Series, Legend, ArgumentAxis, ValueAxis, Tooltip, CommonSeriesSettings, Label } from 'devextreme-react/chart';
import { PieChart, Series as PieSeries, Label as PieLabel, Connector, Legend as PieLegend } from 'devextreme-react/pie-chart';
import notify from 'devextreme/ui/notify';
import {
  getStatistics,
  selectStatistics,
  selectLoading,
  selectError
} from '../../redux/slices/reconciliationSlice';

/**
 * Data Quality Dashboard
 * Displays statistics, trends, and quality metrics
 */
const DataQualityDashboard = () => {
  const dispatch = useDispatch();
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // Last 30 days
  const [endDate, setEndDate] = useState(new Date());

  const statistics = useSelector(selectStatistics);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  // Load statistics on mount and when dates change
  useEffect(() => {
    if (startDate && endDate) {
      loadStatistics();
    }
  }, []); // Only on mount

  const loadStatistics = async () => {
    if (!startDate || !endDate) {
      notify('Please select date range', 'warning', 3000);
      return;
    }

    if (startDate > endDate) {
      notify('Start date must be before end date', 'warning', 3000);
      return;
    }

    const formattedStart = startDate.toISOString().split('T')[0];
    const formattedEnd = endDate.toISOString().split('T')[0];

    try {
      await dispatch(getStatistics({
        startDate: formattedStart,
        endDate: formattedEnd
      })).unwrap();
    } catch (err) {
      notify(`Error: ${err.message || 'Failed to load statistics'}`, 'error', 5000);
    }
  };

  const stats = statistics;
  const qualityScore = stats ? (stats.dataQualityScore || 0).toFixed(1) : 0;

  // Get quality color
  const getQualityColor = (score) => {
    if (score >= 95) return 'tw-text-green-600';
    if (score >= 80) return 'tw-text-yellow-600';
    return 'tw-text-red-600';
  };

  // Prepare chart data
  const trendData = stats?.dailyTrend || [];
  const fieldBreakdownData = stats?.discrepanciesByField || [];

  return (
    <div className="tw-space-y-6">
      {/* Date Range Selector */}
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-calendar-range tw-text-teal-500"></i>
          Statistics Period
        </h3>

        <div className="tw-flex tw-flex-wrap tw-gap-4 tw-items-end">
          <div className="tw-flex-1 tw-min-w-[200px]">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Start Date
            </label>
            <DateBox
              value={startDate}
              onValueChanged={(e) => setStartDate(e.value)}
              displayFormat="dd/MM/yyyy"
              max={endDate || new Date()}
              showClearButton={true}
            />
          </div>

          <div className="tw-flex-1 tw-min-w-[200px]">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              End Date
            </label>
            <DateBox
              value={endDate}
              onValueChanged={(e) => setEndDate(e.value)}
              displayFormat="dd/MM/yyyy"
              min={startDate}
              max={new Date()}
              showClearButton={true}
            />
          </div>

          <Button
            text="Refresh Statistics"
            icon="fa-light fa-arrows-rotate"
            type="default"
            stylingMode="contained"
            onClick={loadStatistics}
            disabled={loading.statistics}
          />
        </div>
      </div>

      {/* Quality Score Card (Large) */}
      {stats && (
        <div className="tw-bg-gradient-to-br tw-from-white tw-to-gray-50 tw-border-2 tw-border-gray-200 tw-rounded-lg tw-p-8 tw-text-center">
          <div className="tw-mb-3">
            <i className="fa-light fa-gauge-high tw-text-5xl tw-text-teal-500"></i>
          </div>
          <h3 className="tw-text-xl tw-font-semibold tw-text-gray-700 tw-mb-2">
            Overall Data Quality Score
          </h3>
          <div className={`tw-text-7xl tw-font-bold ${getQualityColor(qualityScore)} tw-mb-2`}>
            {qualityScore}%
          </div>
          <p className="tw-text-gray-600 tw-text-sm">
            {stats.totalDays - stats.daysWithDiscrepancies} clean days out of {stats.totalDays} total
          </p>
          {qualityScore >= 95 && (
            <div className="tw-mt-4 tw-text-green-600 tw-font-medium">
              <i className="fa-light fa-badge-check tw-mr-2"></i>
              Excellent data quality!
            </div>
          )}
          {qualityScore < 80 && (
            <div className="tw-mt-4 tw-text-orange-600 tw-font-medium">
              <i className="fa-light fa-triangle-exclamation tw-mr-2"></i>
              Action recommended to improve quality
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards Grid */}
      {stats && (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
          {/* Total Discrepancies */}
          <div className="tw-bg-white tw-border tw-border-red-200 tw-rounded-lg tw-p-6">
            <div className="tw-flex tw-items-start tw-justify-between">
              <div>
                <p className="tw-text-sm tw-text-gray-600 tw-mb-1">Total Discrepancies</p>
                <p className="tw-text-3xl tw-font-bold tw-text-red-600">{stats.totalDiscrepancies}</p>
              </div>
              <i className="fa-light fa-triangle-exclamation tw-text-3xl tw-text-red-300"></i>
            </div>
          </div>

          {/* Days with Issues */}
          <div className="tw-bg-white tw-border tw-border-yellow-200 tw-rounded-lg tw-p-6">
            <div className="tw-flex tw-items-start tw-justify-between">
              <div>
                <p className="tw-text-sm tw-text-gray-600 tw-mb-1">Days with Issues</p>
                <p className="tw-text-3xl tw-font-bold tw-text-yellow-600">{stats.daysWithDiscrepancies}</p>
                <p className="tw-text-xs tw-text-gray-500">of {stats.totalDays} days</p>
              </div>
              <i className="fa-light fa-calendar-xmark tw-text-3xl tw-text-yellow-300"></i>
            </div>
          </div>

          {/* Avg Discrepancies per Day */}
          <div className="tw-bg-white tw-border tw-border-orange-200 tw-rounded-lg tw-p-6">
            <div className="tw-flex tw-items-start tw-justify-between">
              <div>
                <p className="tw-text-sm tw-text-gray-600 tw-mb-1">Avg per Day</p>
                <p className="tw-text-3xl tw-font-bold tw-text-orange-600">
                  {stats.daysWithDiscrepancies > 0
                    ? (stats.totalDiscrepancies / stats.daysWithDiscrepancies).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <i className="fa-light fa-chart-simple tw-text-3xl tw-text-orange-300"></i>
            </div>
          </div>

          {/* Most Problematic Field */}
          <div className="tw-bg-white tw-border tw-border-purple-200 tw-rounded-lg tw-p-6">
            <div className="tw-flex tw-items-start tw-justify-between">
              <div>
                <p className="tw-text-sm tw-text-gray-600 tw-mb-1">Top Issue Field</p>
                <p className="tw-text-lg tw-font-bold tw-text-purple-600 tw-truncate">
                  {stats.mostProblematicField || 'N/A'}
                </p>
                <p className="tw-text-xs tw-text-gray-500">
                  {stats.discrepancyByField?.[stats.mostProblematicField] || 0} occurrences
                </p>
              </div>
              <i className="fa-light fa-flag tw-text-3xl tw-text-purple-300"></i>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {stats && (
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
          {/* Discrepancies Trend Chart */}
          {trendData.length > 0 && (
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-chart-line tw-text-teal-500"></i>
                Discrepancies Over Time
              </h3>

              <Chart
                dataSource={trendData}
                height={300}
              >
                <CommonSeriesSettings argumentField="date" type="spline" />
                <Series
                  valueField="count"
                  name="Discrepancies"
                  color="#0891b2"
                />
                <ArgumentAxis>
                  <Label format="dd/MM" />
                </ArgumentAxis>
                <ValueAxis>
                  <Label format="decimal" />
                </ValueAxis>
                <Tooltip enabled={true} />
                <Legend visible={false} />
              </Chart>
            </div>
          )}

          {/* Discrepancies by Field (Pie Chart) */}
          {fieldBreakdownData.length > 0 && (
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-chart-pie tw-text-teal-500"></i>
                Discrepancies by Field
              </h3>

              <PieChart
                dataSource={fieldBreakdownData}
                height={300}
                palette="Soft"
              >
                <PieSeries
                  argumentField="field"
                  valueField="count"
                >
                  <PieLabel visible={true} format="fixedPoint" customizeText={(arg) => `${arg.valueText} (${arg.percentText})`}>
                    <Connector visible={true} />
                  </PieLabel>
                </PieSeries>
                <PieLegend
                  orientation="horizontal"
                  itemTextPosition="right"
                  horizontalAlignment="center"
                  verticalAlignment="bottom"
                />
              </PieChart>
            </div>
          )}
        </div>
      )}

      {/* Quality Score Trend (if available) */}
      {stats?.qualityTrend?.length > 0 && (
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-gauge-high tw-text-teal-500"></i>
            Quality Score Trend
          </h3>

          <Chart
            dataSource={stats.qualityTrend}
            height={250}
          >
            <CommonSeriesSettings argumentField="date" type="spline" />
            <Series
              valueField="score"
              name="Quality Score %"
              color="#10b981"
            />
            <ArgumentAxis>
              <Label format="dd/MM" />
            </ArgumentAxis>
            <ValueAxis>
              <Label format="decimal" />
            </ValueAxis>
            <Tooltip enabled={true} />
            <Legend visible={false} />
          </Chart>
        </div>
      )}

      {/* Top Issues Table */}
      {stats?.topIssues?.length > 0 && (
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-ranking-star tw-text-teal-500"></i>
            Most Frequent Issues
          </h3>

          <div className="tw-space-y-3">
            {stats.topIssues.map((issue, index) => (
              <div
                key={index}
                className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded tw-border tw-border-gray-200"
              >
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-w-8 tw-h-8 tw-bg-teal-100 tw-text-teal-600 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="tw-font-medium tw-text-gray-800">{issue.tankName}</p>
                    <p className="tw-text-sm tw-text-gray-600">Field: {issue.field}</p>
                  </div>
                </div>
                <div className="tw-text-right">
                  <p className="tw-text-xl tw-font-bold tw-text-red-600">{issue.count}</p>
                  <p className="tw-text-xs tw-text-gray-500">occurrences</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error.statistics && (
        <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-start tw-gap-3">
            <i className="fa-light fa-circle-exclamation tw-text-2xl tw-text-red-600"></i>
            <div>
              <h4 className="tw-font-semibold tw-text-red-900 tw-mb-1">Error</h4>
              <p className="tw-text-red-700 tw-text-sm">
                {error.statistics?.message || 'Failed to load statistics'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      {!stats && !loading.statistics && (
        <div className="tw-bg-teal-50 tw-border tw-border-teal-200 tw-rounded-lg tw-p-6">
          <div className="tw-flex tw-items-start tw-gap-3">
            <i className="fa-light fa-circle-info tw-text-2xl tw-text-teal-600"></i>
            <div>
              <h4 className="tw-font-semibold tw-text-teal-900 tw-mb-2">About Data Quality Metrics</h4>
              <ul className="tw-text-sm tw-text-teal-800 tw-space-y-1 tw-list-disc tw-list-inside">
                <li>Quality Score indicates the percentage of days without discrepancies</li>
                <li>Scores above 95% indicate excellent data quality</li>
                <li>Scores below 80% suggest immediate action is needed</li>
                <li>Trend charts help identify patterns and recurring issues</li>
                <li>Top issues highlight tanks and fields requiring attention</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataQualityDashboard;
