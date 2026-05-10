import React, { createContext, useContext, useMemo } from 'react';
import { useDashboardPreferences } from '../../../hooks/useDashboardPreferences';

const DashboardPreferencesContext = createContext(null);

export const PreferencesProvider = ({ children }) => {
  const prefs = useDashboardPreferences();
  const value = useMemo(() => prefs, [prefs]);
  return (
    <DashboardPreferencesContext.Provider value={value}>
      {children}
    </DashboardPreferencesContext.Provider>
  );
};

export const usePreferencesContext = () => {
  return useContext(DashboardPreferencesContext);
};

export default PreferencesProvider;
