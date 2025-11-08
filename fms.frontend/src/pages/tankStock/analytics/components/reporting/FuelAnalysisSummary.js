import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { SelectBox } from 'devextreme-react/select-box';
import './FuelAnalysisSummary.scss';

const FuelAnalysisSummary = ({ data, analysisGroupBy, onAnalysisGroupByChange }) => {
  const groupByOptions = [
    { value: 'day', text: 'Daily' },
    { value: 'week', text: 'Weekly' },
    { value: 'month', text: 'Monthly' },
    { value: 'year', text: 'Yearly' }
  ];

  // Calculate average fuel summary by volume change reason
  const analysisSummary = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) {
      return [];
    }

    // Group by changeReason and calculate averages
    const reasonGroups = {};

    data.data.forEach(item => {
      const reason = item.changeReason || 'Unknown';

      if (!reasonGroups[reason]) {
        reasonGroups[reason] = {
          reason,
          totalVolume: 0,
          count: 0,
          transactions: 0
        };
      }

      reasonGroups[reason].totalVolume += item.totalVolume || 0;
      reasonGroups[reason].count += 1;
      reasonGroups[reason].transactions += item.transactionCount || 0;
    });

    // Convert to array and calculate averages
    return Object.values(reasonGroups).map(group => ({
      reason: group.reason,
      totalVolume: group.totalVolume,
      averageVolume: group.count > 0 ? group.totalVolume / group.count : 0,
      count: group.count,
      transactions: group.transactions
    })).sort((a, b) => b.totalVolume - a.totalVolume);
  }, [data]);

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    return analysisSummary.reduce((acc, item) => ({
      totalVolume: acc.totalVolume + item.totalVolume,
      transactions: acc.transactions + item.transactions,
      records: acc.records + item.count
    }), { totalVolume: 0, transactions: 0, records: 0 });
  }, [analysisSummary]);

  return (
    <div className="fuel-analysis-summary tw-bg-white tw-rounded-lg tw-shadow tw-p-4 tw-mb-6">
      {/* Header */}
      <div className="tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center tw-mb-4 tw-gap-3">
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-chart-bar tw-mr-2 tw-text-blue-600"></i>
            Fuel Analysis Summary
          </h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Average fuel summary by volume change reason
          </p>
        </div>

        <div className="tw-flex tw-items-center tw-gap-2">
          <label className="tw-text-sm tw-font-medium tw-text-gray-700">
            Group By:
          </label>
          <SelectBox
            value={analysisGroupBy}
            onValueChanged={(e) => onAnalysisGroupByChange(e.value)}
            dataSource={groupByOptions}
            displayExpr="text"
            valueExpr="value"
            width={150}
          />
        </div>
      </div>

      {/* Grand Totals Summary */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-mb-4">
        <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4 tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-blue-600 tw-font-medium">Total Volume</p>
              <p className="tw-text-2xl tw-font-bold tw-text-blue-900">
                {grandTotals.totalVolume.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </p>
            </div>
            <i className="fa-light fa-gas-pump tw-text-3xl tw-text-blue-400"></i>
          </div>
        </div>

        <div className="tw-bg-green-50 tw-rounded-lg tw-p-4 tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-green-600 tw-font-medium">Total Transactions</p>
              <p className="tw-text-2xl tw-font-bold tw-text-green-900">
                {grandTotals.transactions.toLocaleString()}
              </p>
            </div>
            <i className="fa-light fa-receipt tw-text-3xl tw-text-green-400"></i>
          </div>
        </div>

        <div className="tw-bg-purple-50 tw-rounded-lg tw-p-4 tw-border tw-border-purple-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-purple-600 tw-font-medium">Total Records</p>
              <p className="tw-text-2xl tw-font-bold tw-text-purple-900">
                {grandTotals.records.toLocaleString()}
              </p>
            </div>
            <i className="fa-light fa-database tw-text-3xl tw-text-purple-400"></i>
          </div>
        </div>
      </div>

      {/* Analysis Table */}
      <div className="tw-overflow-x-auto">
        <table className="tw-w-full tw-text-sm">
          <thead className="tw-bg-gray-100 tw-border-b tw-border-gray-200">
            <tr>
              <th className="tw-text-left tw-p-3 tw-font-semibold tw-text-gray-700">
                Volume Change Reason
              </th>
              <th className="tw-text-right tw-p-3 tw-font-semibold tw-text-gray-700">
                Total Volume
              </th>
              <th className="tw-text-right tw-p-3 tw-font-semibold tw-text-gray-700">
                Average Volume
              </th>
              <th className="tw-text-right tw-p-3 tw-font-semibold tw-text-gray-700">
                Records
              </th>
              <th className="tw-text-right tw-p-3 tw-font-semibold tw-text-gray-700">
                Transactions
              </th>
              <th className="tw-text-right tw-p-3 tw-font-semibold tw-text-gray-700">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody>
            {analysisSummary.length > 0 ? (
              analysisSummary.map((item, index) => (
                <tr
                  key={item.reason}
                  className={`tw-border-b tw-border-gray-100 hover:tw-bg-gray-50 ${
                    index % 2 === 0 ? 'tw-bg-white' : 'tw-bg-gray-50'
                  }`}
                >
                  <td className="tw-p-3 tw-font-medium tw-text-gray-800">
                    {item.reason}
                  </td>
                  <td className="tw-p-3 tw-text-right tw-text-gray-700">
                    {item.totalVolume.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </td>
                  <td className="tw-p-3 tw-text-right tw-text-gray-700">
                    {item.averageVolume.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className="tw-p-3 tw-text-right tw-text-gray-700">
                    {item.count.toLocaleString()}
                  </td>
                  <td className="tw-p-3 tw-text-right tw-text-gray-700">
                    {item.transactions.toLocaleString()}
                  </td>
                  <td className="tw-p-3 tw-text-right tw-text-gray-700">
                    <span className="tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded tw-bg-blue-100 tw-text-blue-800 tw-font-medium">
                      {grandTotals.totalVolume > 0
                        ? ((item.totalVolume / grandTotals.totalVolume) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="tw-p-8 tw-text-center tw-text-gray-500">
                  <i className="fa-light fa-inbox tw-text-4xl tw-mb-2"></i>
                  <p>No data available for analysis</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

FuelAnalysisSummary.propTypes = {
  data: PropTypes.object,
  analysisGroupBy: PropTypes.string,
  onAnalysisGroupByChange: PropTypes.func
};

FuelAnalysisSummary.defaultProps = {
  analysisGroupBy: 'day'
};

export default FuelAnalysisSummary;
