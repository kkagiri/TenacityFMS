// /**
//  * SIGNALR-ONLY FIX FOR DASHBOARD
//  * This file shows the exact changes needed to eliminate REST API calls
//  * and use SignalR exclusively for all dashboard data loading.
//  */

// // 1. REPLACE loadInitialMetrics function with this SignalR-only version:
// const loadInitialMetrics = useCallback(async () => {
//   try {
//     console.log('Loading initial metrics using SignalR only...');

//     // Wait for SignalR connection if not ready
//     if (!signalRService.getConnectionStatus()) {
//       console.log('SignalR not connected, skipping initial metrics...');
//       return;
//     }

//     // Define metrics to load via SignalR
//     const metricsToLoad = [
//       { dataSource: 'fuel_dispense', mode: 'live', datePreset: 'today' },
//       { dataSource: 'engine_hours', mode: 'live', datePreset: 'today' },
//       { dataSource: 'km_travel', mode: 'historical', datePreset: 'today' },
//       { dataSource: 'fuel_used_gps', mode: 'historical', datePreset: 'today' }
//     ];

//     // Request all metrics via SignalR
//     for (const metric of metricsToLoad) {
//       try {
//         await signalRService.invoke('RequestMetricData', {
//           dataSource: metric.dataSource,
//           mode: metric.mode,
//           datePreset: metric.datePreset,
//           filters: {}
//         });
//         console.log(`[SignalR] Requested metric: ${metric.dataSource}`);
//       } catch (error) {
//         console.warn(`[SignalR] Failed to request ${metric.dataSource}:`, error);
//       }
//     }

//   } catch (error) {
//     console.error('SignalR-only metrics loading failed:', error);
//   }
// }, []);

// // 2. REPLACE fetchWidgetDataFromDataSource with this SignalR-only version:
// const fetchWidgetDataFromDataSource = useCallback(async (widgetInstanceId, widget, config) => {
//   try {
//     console.log(`[SignalR-Only] Loading widget ${widgetInstanceId}`);

//     // Check SignalR connection
//     if (!signalRService.getConnectionStatus()) {
//       setWidgetErrors(prev => ({
//         ...prev,
//         [widgetInstanceId]: 'SignalR not connected. Please refresh the page.'
//       }));
//       return;
//     }

//     // Set loading state
//     setWidgetLoadingStates(prev => ({ ...prev, [widgetInstanceId]: true }));

//     const dataSource = widget.template?.dataSource || widget.settings?.dataSource || 'fuel_dispense';

//     // Set up response listener
//     const responsePromise = new Promise((resolve, reject) => {
//       const timeout = setTimeout(() => {
//         reject(new Error('SignalR timeout - server may be busy'));
//       }, 15000); // 15 second timeout (more reasonable)

//       const handleResponse = (data) => {
//         if (data.widgetInstanceId === widgetInstanceId) {
//           clearTimeout(timeout);
//           signalRService.off('widgetDataUpdate', handleResponse);
//           resolve(data);
//         }
//       };

//       signalRService.on('widgetDataUpdate', handleResponse);
//     });

//     // Send SignalR request
//     await signalRService.invoke('RequestWidgetData', {
//       widgetInstanceId: widgetInstanceId,
//       dataSource: dataSource,
//       mode: config.mode || 'historical',
//       datePreset: config.datePreset || 'today',
//       filters: config.filters || {}
//     });

//     // Wait for response
//     const response = await responsePromise;

//     if (response.success) {
//       setWidgetData(prev => ({
//         ...prev,
//         [widgetInstanceId]: {
//           ...response.data,
//           lastUpdated: new Date().toISOString(),
//           loadedVia: 'SignalR-Only'
//         }
//       }));

//       setWidgetErrors(prev => ({ ...prev, [widgetInstanceId]: null }));
//     } else {
//       throw new Error(response.error || 'SignalR request failed');
//     }

//   } catch (error) {
//     console.error(`SignalR-only error for widget ${widgetInstanceId}:`, error);
//     setWidgetErrors(prev => ({
//       ...prev,
//       [widgetInstanceId]: error.message
//     }));
//   } finally {
//     setWidgetLoadingStates(prev => ({ ...prev, [widgetInstanceId]: false }));
//   }
// }, []);

// // 3. REMOVE these functions entirely (they trigger REST API calls):
// // - fetchDataViaRestApi()
// // - getOptimalDataLoadingStrategy()

// // 4. UPDATE the widget data loading effect to be SignalR-only:
// useEffect(() => {
//   if (widgetInstances.length > 0 && signalRService.getConnectionStatus()) {
//     console.log('[SignalR-Only] Loading widget data for all widgets');

//     widgetInstances.forEach(widget => {
//       fetchWidgetDataFromDataSource(widget.id, widget, widget.settings || {});
//     });
//   }
// }, [widgetInstances, signalRService.getConnectionStatus()]);

// /**
//  * SUMMARY OF CHANGES:
//  *
//  * ✅ Remove all REST API calls from loadInitialMetrics
//  * ✅ Remove REST API fallback from fetchWidgetDataFromDataSource
//  * ✅ Remove 3-second timeout that triggers REST API
//  * ✅ Use longer, more reasonable timeouts (15 seconds)
//  * ✅ Show clear error messages when SignalR not available
//  * ✅ Load data only when SignalR is connected
//  *
//  * RESULT: Zero REST API calls - SignalR only!
//  */
