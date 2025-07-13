import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useDateRange } from '../../../hooks/useDateRange';
import StockManagement from './StockManagement';

const StockManagementPage = () => {
  const sites = useSelector((state) => state.site.sites);
  const user = useSelector((state) => state.auth.user);

  const [selectedSite] = useState(() => {
    const storedSite = localStorage.getItem('selectedSite');
    return storedSite && storedSite !== 'null' ? storedSite : 'all';
  });

  // Use stable date range hook
  const { dateRange } = useDateRange(30); // 30 days by default

  // Create subtitle with filter information for the header
  const headerSubtitle = (
    <>
      <span>
        Period: {new Date(dateRange[0]).toLocaleDateString()} - {new Date(dateRange[1]).toLocaleDateString()}
      </span>
      <span>
        Site: {selectedSite === 'all' ? 'All Sites' : sites.find(s => s.id === selectedSite)?.name || 'Unknown'}
      </span>
      <span>
        User: {user?.name || 'Unknown'}
      </span>
    </>
  );

  return <StockManagement pageSubtitle={headerSubtitle} />;
};

export default StockManagementPage;
