import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { TagBox } from 'devextreme-react/tag-box';
import { usePreferencesContext } from './PreferencesProvider';

// Multi-select dropdown for site filters using DevExtreme TagBox
export default function SiteFiltersMultiSelect({ allSites }) {
  const prefs = usePreferencesContext();
  const siteFilters = prefs?.siteFilters || [];
  const setSiteFilters = prefs?.setSiteFilters || (() => {});

  const sortedSites = useMemo(() =>
    (allSites || []).slice().sort((a,b) => String(a.name).localeCompare(String(b.name))),
    [allSites]
  );

  const handleSelectionChanged = (e) => {
    setSiteFilters(e.value || []);
  };

  return (
    <div className="tw-w-full">
      <TagBox
        dataSource={sortedSites}
        displayExpr="name"
        valueExpr="id"
        value={siteFilters}
        onValueChanged={handleSelectionChanged}
        placeholder="Select sites..."
        searchEnabled={true}
        showSelectionControls={true}
        applyValueMode="useButtons"
        multiline={false}
        className="tw-w-full"
        height={36}
      />
    </div>
  );
}

SiteFiltersMultiSelect.propTypes = {
  allSites: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string
  }))
};