import React from 'react';
import PropTypes from 'prop-types';
import { DateBox } from 'devextreme-react/date-box';
import { TagBox } from 'devextreme-react/tag-box';
import { Button } from 'devextreme-react/button';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchSiteList } from '../../../../../redux/actions/siteActions';
import notify from 'devextreme/ui/notify';

/**
 * CommonFilterPanel - Shared filter panel component for analytics pages
 * Provides consistent filtering across multiple analytics tabs
 */
const CommonFilterPanel = ({
  startDate,
  endDate,
  selectedSiteIds,
  selectedTankIds,
  onStartDateChange,
  onEndDateChange,
  onSiteIdsChange,
  onTankIdsChange,
  onApplyFilters,
  loading = false,
  showTankFilter = true
}) => {
  const dispatch = useDispatch();
  const sites = useSelector((state) => state.site?.sites || []);
  const tanks = useSelector((state) => state.tank?.tanks || []);

  // Load sites on mount
  useEffect(() => {
    dispatch(fetchSiteList());
  }, [dispatch]);

  // Filter tanks based on selected sites
  const filteredTanks = React.useMemo(() => {
    if (!selectedSiteIds || selectedSiteIds.length === 0) {
      return tanks;
    }
    return tanks.filter(tank => selectedSiteIds.includes(tank.siteId));
  }, [tanks, selectedSiteIds]);

  const handleApply = () => {
    if (!startDate || !endDate) {
      notify({
        message: 'Please select both start and end dates',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    if (startDate > endDate) {
      notify({
        message: 'Start date cannot be greater than end date.',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    onApplyFilters();
  };

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-4">
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-4">
        {/* Start Date */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Start Date
          </label>
          <DateBox
            value={startDate}
            onValueChanged={(e) => onStartDateChange(e.value)}
            displayFormat="dd/MM/yyyy"
            type="date"
            showClearButton={false}
            width="100%"
            disabled={loading}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            End Date
          </label>
          <DateBox
            value={endDate}
            onValueChanged={(e) => onEndDateChange(e.value)}
            displayFormat="dd/MM/yyyy"
            type="date"
            showClearButton={false}
            width="100%"
            disabled={loading}
          />
        </div>

        {/* Site Filter */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Site <span className="tw-text-gray-500 tw-text-xs">(Leave empty for all)</span>
          </label>
          <TagBox
            value={selectedSiteIds}
            onValueChanged={(e) => onSiteIdsChange(e.value)}
            dataSource={sites}
            displayExpr="name"
            valueExpr="id"
            placeholder="Select sites..."
            showClearButton={true}
            searchEnabled={true}
            width="100%"
            disabled={loading}
          />
        </div>

        {/* Apply Button */}
        <div className="tw-flex tw-items-end">
          <Button
            text="Apply Filters"
            type="default"
            icon="fa-light fa-filter"
            onClick={handleApply}
            disabled={loading}
            width="100%"
            stylingMode="contained"
          />
        </div>
      </div>

      {/* Tank Filter Row (Optional) */}
      {showTankFilter && (
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Tank <span className="tw-text-gray-500 tw-text-xs">(Leave empty for all)</span>
            </label>
            <TagBox
              value={selectedTankIds}
              onValueChanged={(e) => onTankIdsChange(e.value)}
              dataSource={filteredTanks}
              displayExpr="name"
              valueExpr="id"
              placeholder="Select tanks..."
              showClearButton={true}
              searchEnabled={true}
              width="100%"
              disabled={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

CommonFilterPanel.propTypes = {
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  selectedSiteIds: PropTypes.array,
  selectedTankIds: PropTypes.array,
  onStartDateChange: PropTypes.func.isRequired,
  onEndDateChange: PropTypes.func.isRequired,
  onSiteIdsChange: PropTypes.func.isRequired,
  onTankIdsChange: PropTypes.func,
  onApplyFilters: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  showTankFilter: PropTypes.bool
};

export default CommonFilterPanel;
