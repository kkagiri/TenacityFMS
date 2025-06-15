//Cursor - Custom hook for tank stock SignalR integration
import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import signalRService from '../signalR/SignalRService';
import {
    FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS,
    FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_SUCCESS
} from '../redux/actions/tankVolumeHistoryActions';
import {
    FETCH_DELIVERIES_SUCCESS
} from '../redux/actions/tankStockAction';
import {
    FETCH_CONSUMPTION_SUCCESS
} from '../redux/actions/consumptionActions';
import {
    FETCH_TANKS_SUCCESS
} from '../redux/actions/tankActions';
import notify from 'devextreme/ui/notify';

export const useTankStockSignalR = (selectedSite, dateRange, isEnabled = true) => {
    const dispatch = useDispatch();
    const connectionState = useSelector(state => state.signalR?.connectionState);
    const isConnected = connectionState === 'connected';
    const handlersRegistered = useRef(false);

    //Cursor - Handle tank volume history updates
    const handleTankVolumeHistoryUpdate = useCallback((data) => {
        console.log('[TankStock SignalR] Received tank volume history update:', data);

        if (data && Array.isArray(data)) {
            dispatch({
                type: FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS,
                payload: data
            });
            notify('Tank volume history updated', 'info', 2000);
        }
    }, [dispatch]);

    //Cursor - Handle tank delivery updates
    const handleTankDeliveryUpdate = useCallback((data) => {
        console.log('[TankStock SignalR] Received tank delivery update:', data);

        if (data) {
            dispatch({
                type: FETCH_DELIVERIES_SUCCESS,
                payload: Array.isArray(data) ? data : [data]
            });
            notify('Tank deliveries updated', 'info', 2000);
        }
    }, [dispatch]);

    //Cursor - Handle consumption updates
    const handleConsumptionUpdate = useCallback((data) => {
        console.log('[TankStock SignalR] Received consumption update:', data);

        if (data) {
            dispatch({
                type: FETCH_CONSUMPTION_SUCCESS,
                payload: Array.isArray(data) ? data : [data]
            });
            notify('Consumption data updated', 'info', 2000);
        }
    }, [dispatch]);

    //Cursor - Handle tank stock current level updates
    const handleTankStockUpdate = useCallback((data) => {
        console.log('[TankStock SignalR] Received tank stock update:', data);

        if (data) {
            dispatch({
                type: FETCH_TANKS_SUCCESS,
                payload: Array.isArray(data) ? data : [data]
            });
            notify('Tank stock levels updated', 'info', 2000);
        }
    }, [dispatch]);

    //Cursor - Handle stock adjustment updates
    const handleStockAdjustmentUpdate = useCallback((data) => {
        console.log('[TankStock SignalR] Received stock adjustment update:', data);

        if (data) {
            // Trigger refresh of related data
            requestTankDataRefresh();
            notify('Stock adjustment processed', 'success', 3000);
        }
    }, []);

    //Cursor - Handle comprehensive dashboard updates
    const handleTankDashboardUpdate = useCallback((data) => {
        console.log('[TankStock SignalR] Received tank dashboard update:', data);

        if (data) {
            // Update multiple stores with comprehensive data
            if (data.tankVolumeHistory) {
                dispatch({
                    type: FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS,
                    payload: data.tankVolumeHistory
                });
            }

            if (data.deliveries) {
                dispatch({
                    type: FETCH_DELIVERIES_SUCCESS,
                    payload: data.deliveries
                });
            }

            if (data.consumption) {
                dispatch({
                    type: FETCH_CONSUMPTION_SUCCESS,
                    payload: data.consumption
                });
            }

            if (data.tanks) {
                dispatch({
                    type: FETCH_TANKS_SUCCESS,
                    payload: data.tanks
                });
            }

            notify('Tank dashboard data refreshed', 'info', 2000);
        }
    }, [dispatch]);

    //Cursor - Request tank data refresh from server
    const requestTankDataRefresh = useCallback(() => {
        if (isConnected && signalRService.connection && dateRange && dateRange.length === 2) {
            const [startDate, endDate] = dateRange;
            const siteId = selectedSite === 'all' ? null : selectedSite;

            console.log('[TankStock SignalR] Requesting tank data refresh for site:', siteId, 'dateRange:', dateRange);

            signalRService.connection.invoke('RequestTankDataUpdate', siteId, startDate, endDate)
                .catch(error => {
                    console.error('[TankStock SignalR] Error requesting tank data refresh:', error);
                });
        }
    }, [isConnected, selectedSite, dateRange]);

    //Cursor - Register SignalR event handlers
    const registerEventHandlers = useCallback(() => {
        if (!signalRService.connection || handlersRegistered.current) {
            return;
        }

        console.log('[TankStock SignalR] Registering tank stock event handlers');

        // Remove existing handlers to prevent duplicates
        signalRService.connection.off('TankVolumeHistoryUpdate');
        signalRService.connection.off('TankDeliveryUpdate');
        signalRService.connection.off('ConsumptionUpdate');
        signalRService.connection.off('TankStockUpdate');
        signalRService.connection.off('StockAdjustmentUpdate');
        signalRService.connection.off('TankDashboardUpdate');

        // Register new handlers
        signalRService.connection.on('TankVolumeHistoryUpdate', handleTankVolumeHistoryUpdate);
        signalRService.connection.on('TankDeliveryUpdate', handleTankDeliveryUpdate);
        signalRService.connection.on('ConsumptionUpdate', handleConsumptionUpdate);
        signalRService.connection.on('TankStockUpdate', handleTankStockUpdate);
        signalRService.connection.on('StockAdjustmentUpdate', handleStockAdjustmentUpdate);
        signalRService.connection.on('TankDashboardUpdate', handleTankDashboardUpdate);

        handlersRegistered.current = true;
    }, [
        handleTankVolumeHistoryUpdate,
        handleTankDeliveryUpdate,
        handleConsumptionUpdate,
        handleTankStockUpdate,
        handleStockAdjustmentUpdate,
        handleTankDashboardUpdate
    ]);

    //Cursor - Unregister event handlers
    const unregisterEventHandlers = useCallback(() => {
        if (signalRService.connection && handlersRegistered.current) {
            console.log('[TankStock SignalR] Unregistering tank stock event handlers');

            signalRService.connection.off('TankVolumeHistoryUpdate');
            signalRService.connection.off('TankDeliveryUpdate');
            signalRService.connection.off('ConsumptionUpdate');
            signalRService.connection.off('TankStockUpdate');
            signalRService.connection.off('StockAdjustmentUpdate');
            signalRService.connection.off('TankDashboardUpdate');

            handlersRegistered.current = false;
        }
    }, []);

    //Cursor - Setup and cleanup effects
    useEffect(() => {
        if (isEnabled && isConnected) {
            registerEventHandlers();
        }

        return () => {
            if (handlersRegistered.current) {
                unregisterEventHandlers();
            }
        };
    }, [isEnabled, isConnected, registerEventHandlers, unregisterEventHandlers]);

    //Cursor - Handle site or date range changes
    useEffect(() => {
        if (isEnabled && isConnected && handlersRegistered.current) {
            // Small delay to ensure handlers are properly registered
            const timeoutId = setTimeout(() => {
                requestTankDataRefresh();
            }, 500);

            return () => clearTimeout(timeoutId);
        }
    }, [selectedSite, dateRange, isEnabled, isConnected, requestTankDataRefresh]);

    return {
        isConnected,
        requestTankDataRefresh,
        registerEventHandlers,
        unregisterEventHandlers
    };
};