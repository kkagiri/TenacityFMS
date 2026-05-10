import React from 'react';
import { createPortal } from 'react-dom';
import { usePortalContainer } from '../hooks/usePortalContainer';

const FilterInfoBar = ({
  dateRange,
  selectedSite,
  sites,
  user,
  onFilterClick
}) => {
  const portalContainer = usePortalContainer('header-filter-info');

  // Safety check for date range
  if (!dateRange || !Array.isArray(dateRange) || dateRange.length < 2) {
    return null;
  }

  // Safety check for sites array
  const sitesArray = Array.isArray(sites) ? sites : [];

  const filterInfo = (
    <div className="tw-flex tw-items-center tw-space-x-3 tw-text-sm tw-text-gray-600">
      <span
        className="tw-bg-blue-50 tw-text-blue-700 tw-px-2 tw-py-1 tw-rounded tw-cursor-pointer hover:tw-bg-blue-100"
        onClick={onFilterClick}
        title="Click to change filter"
      >
        Period: {new Date(dateRange[0]).toLocaleDateString()} - {new Date(dateRange[1]).toLocaleDateString()}
      </span>
      <span className="tw-bg-gray-50 tw-text-gray-700 tw-px-2 tw-py-1 tw-rounded">
        Site: {selectedSite === 'all' ? 'All Sites' : sitesArray.find(s => s.id === selectedSite)?.name || 'Unknown'}
      </span>
      <span className="tw-bg-gray-50 tw-text-gray-700 tw-px-2 tw-py-1 tw-rounded">
        User: {user?.name || 'Unknown'}
      </span>
    </div>
  );

  // Only create portal if we have a valid container
  if (!portalContainer) {
    return null;
  }

  return createPortal(filterInfo, portalContainer);
};

export default FilterInfoBar;
