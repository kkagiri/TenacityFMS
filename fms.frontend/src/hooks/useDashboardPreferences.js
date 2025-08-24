import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadDashboardInitialization, toggleTicker, setTickerOrder, savePreferences, setSiteFilters, setTankFilters, setVehicleFilters, setTickerSizes, setLayoutSettings } from '../redux/actions/dashboardPreferencesActions';
import notify from 'devextreme/ui/notify';

// Hook providing a cohesive interface for dashboard preferences life-cycle
export const useDashboardPreferences = () => {
  const dispatch = useDispatch();
  const state = useSelector(s => s.dashboardPreferences);
  const saveDebounceRef = useRef(null);

  useEffect(() => { dispatch(loadDashboardInitialization()); }, [dispatch]);

  // Debounced auto-save when dirty changes
  useEffect(() => {
    if (!state?.dirty) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      dispatch(savePreferences());
    }, 800); // 800ms debounce window
    return () => { if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current); };
  }, [state.dirty, dispatch]);

  // Notify on save success/failure
  useEffect(() => {
    if (!state) return;
    if (state.loading.save === false && state.dirty === false && state.lastSavedAt) {
      notify({ message: 'Dashboard preferences saved', type: 'success', displayTime: 1500 });
    }
    if (state.error && state.loading.save === false) {
      notify({ message: `Save failed: ${state.error}`, type: 'error', displayTime: 3000 });
    }
  }, [state?.loading.save, state?.dirty, state?.lastSavedAt, state?.error, state]);

  const onToggleTicker = useCallback((tickerType) => {
    dispatch(toggleTicker(tickerType));
  }, [dispatch]);

  const onReorder = useCallback((orderedTypes) => {
    dispatch(setTickerOrder(orderedTypes));
  }, [dispatch]);

  const updateSiteFilters = useCallback((siteIds) => {
    dispatch(setSiteFilters(siteIds));
  }, [dispatch]);

  const updateTankFilters = useCallback((tankIds) => {
    dispatch(setTankFilters(tankIds));
  }, [dispatch]);

  const updateVehicleFilters = useCallback((vehicleIds) => {
    dispatch(setVehicleFilters(vehicleIds));
  }, [dispatch]);

  const updateTickerSizes = useCallback((sizes) => {
    dispatch(setTickerSizes(sizes));
  }, [dispatch]);

  const updateLayoutSettings = useCallback((settings) => {
    dispatch(setLayoutSettings(settings));
  }, [dispatch]);

  return {
    ...state,
    toggleTicker: onToggleTicker,
    setOrder: onReorder,
    setSiteFilters: updateSiteFilters,
    setTankFilters: updateTankFilters,
    setVehicleFilters: updateVehicleFilters,
    setTickerSizes: updateTickerSizes,
    setLayoutSettings: updateLayoutSettings,
    forceSave: () => dispatch(savePreferences())
  };
};
