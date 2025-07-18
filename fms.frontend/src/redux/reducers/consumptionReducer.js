import {
    FETCH_CONSUMPTION_SUCCESS,
    FETCH_CONSUMPTION_FAILURE,
    FETCH_VEHICLE_REFILLS_REQUEST,
    FETCH_VEHICLE_REFILLS_FAILURE,
    FETCH_HISTORY_CONSUMPTION_REQUEST,
    FETCH_HISTORY_CONSUMPTION_SUCCESS,
    FETCH_HISTORY_CONSUMPTION_FAILURE,
    FETCH_CONSUMPTION_BY_ID_REQUEST,
    FETCH_CONSUMPTION_BY_ID_SUCCESS,
    FETCH_CONSUMPTION_BY_ID_FAILURE,
    CREATE_CONSUMPTION_REQUEST,
    CREATE_CONSUMPTION_SUCCESS,
    CREATE_CONSUMPTION_FAILURE,
    FETCH_CONSUMPTION_LIST_REQUEST,
    FETCH_CONSUMPTION_LIST_SUCCESS,
    FETCH_CONSUMPTION_LIST_FAILURE,
    UPDATE_CONSUMPTION_REQUEST,
    UPDATE_CONSUMPTION_SUCCESS,
    UPDATE_CONSUMPTION_FAILURE,
    IMPORT_FUEL_REPORT_REQUEST,
    IMPORT_FUEL_REPORT_SUCCESS,
    IMPORT_FUEL_REPORT_FAILURE,
    FETCH_PUMP_TRANSACTIONS_REQUEST,
    FETCH_PUMP_TRANSACTIONS_SUCCESS,
    FETCH_PUMP_TRANSACTIONS_FAILURE
} from '../actions/consumptionActions';

const initialState = {
    // General consumption data
    consumptionData: [],
    loading: false,
    error: null,

    // Vehicle refills specific
    vehicleRefills: [],
    vehicleRefillsLoading: false,
    vehicleRefillsError: null,

    // History consumption data
    historyConsumption: [],
    historyConsumptionLoading: false,
    historyConsumptionError: null,

    // Consumption by ID
    selectedConsumption: null,
    selectedConsumptionLoading: false,
    selectedConsumptionError: null,

    // Consumption list with pagination
    consumptionList: [],
    consumptionListLoading: false,
    consumptionListError: null,

    // Create/Update operations
    createLoading: false,
    createError: null,
    updateLoading: false,
    updateError: null,

    // Import operations
    importLoading: false,
    importError: null,
    importResults: null,
    importValidationErrors: [],

    // Pump transactions specific
    pumpTransactions: [],
    pumpTransactionsLoading: false,
    pumpTransactionsError: null,
    pumpTransactionsLastFetch: null,
    pumpTransactionsFilters: null
};

const consumptionReducer = (state = initialState, action) => {
    switch (action.type) {
        // General consumption fetch operations
        case FETCH_CONSUMPTION_SUCCESS:
            return {
                ...state,
                consumptionData: action.payload,
                loading: false,
                error: null
            };

        case FETCH_CONSUMPTION_FAILURE:
            return {
                ...state,
                consumptionData: [],
                loading: false,
                error: action.payload
            };

        // Vehicle refills operations
        case FETCH_VEHICLE_REFILLS_REQUEST:
            return {
                ...state,
                vehicleRefills: action.payload,
                vehicleRefillsLoading: false,
                vehicleRefillsError: null
            };

        case FETCH_VEHICLE_REFILLS_FAILURE:
            return {
                ...state,
                vehicleRefills: [],
                vehicleRefillsLoading: false,
                vehicleRefillsError: action.payload
            };

        // History consumption operations
        case FETCH_HISTORY_CONSUMPTION_REQUEST:
            return {
                ...state,
                historyConsumptionLoading: true,
                historyConsumptionError: null
            };

        case FETCH_HISTORY_CONSUMPTION_SUCCESS:
            return {
                ...state,
                historyConsumption: action.payload,
                historyConsumptionLoading: false,
                historyConsumptionError: null
            };

        case FETCH_HISTORY_CONSUMPTION_FAILURE:
            return {
                ...state,
                historyConsumption: [],
                historyConsumptionLoading: false,
                historyConsumptionError: action.payload
            };

        // Consumption by ID operations
        case FETCH_CONSUMPTION_BY_ID_REQUEST:
            return {
                ...state,
                selectedConsumptionLoading: true,
                selectedConsumptionError: null
            };

        case FETCH_CONSUMPTION_BY_ID_SUCCESS:
            return {
                ...state,
                selectedConsumption: action.payload,
                selectedConsumptionLoading: false,
                selectedConsumptionError: null
            };

        case FETCH_CONSUMPTION_BY_ID_FAILURE:
            return {
                ...state,
                selectedConsumption: null,
                selectedConsumptionLoading: false,
                selectedConsumptionError: action.payload
            };

        // Create consumption operations
        case CREATE_CONSUMPTION_REQUEST:
            return {
                ...state,
                createLoading: true,
                createError: null
            };

        case CREATE_CONSUMPTION_SUCCESS:
            return {
                ...state,
                createLoading: false,
                createError: null,
                // Optionally add to consumption list if it exists
                consumptionList: state.consumptionList.length > 0
                    ? [action.payload, ...state.consumptionList]
                    : state.consumptionList
            };

        case CREATE_CONSUMPTION_FAILURE:
            return {
                ...state,
                createLoading: false,
                createError: action.payload
            };

        // Consumption list operations
        case FETCH_CONSUMPTION_LIST_REQUEST:
            return {
                ...state,
                consumptionListLoading: true,
                consumptionListError: null
            };

        case FETCH_CONSUMPTION_LIST_SUCCESS:
            return {
                ...state,
                consumptionList: action.payload,
                consumptionListLoading: false,
                consumptionListError: null
            };

        case FETCH_CONSUMPTION_LIST_FAILURE:
            return {
                ...state,
                consumptionList: [],
                consumptionListLoading: false,
                consumptionListError: action.payload
            };

        // Update consumption operations
        case UPDATE_CONSUMPTION_REQUEST:
            return {
                ...state,
                updateLoading: true,
                updateError: null
            };

        case UPDATE_CONSUMPTION_SUCCESS:
            return {
                ...state,
                updateLoading: false,
                updateError: null,
                // Update the consumption in the list if it exists
                consumptionList: state.consumptionList.map(item =>
                    item.id === action.payload.id
                        ? { ...item, ...action.payload.data }
                        : item
                ),
                // Update selected consumption if it's the same ID
                selectedConsumption: state.selectedConsumption?.id === action.payload.id
                    ? { ...state.selectedConsumption, ...action.payload.data }
                    : state.selectedConsumption
            };

        case UPDATE_CONSUMPTION_FAILURE:
            return {
                ...state,
                updateLoading: false,
                updateError: action.payload
            };

        // Import fuel report operations
        case IMPORT_FUEL_REPORT_REQUEST:
            return {
                ...state,
                importLoading: true,
                importError: null,
                importResults: null,
                importValidationErrors: []
            };

        case IMPORT_FUEL_REPORT_SUCCESS:
            return {
                ...state,
                importLoading: false,
                importError: null,
                importResults: action.payload,
                importValidationErrors: []
            };

        case IMPORT_FUEL_REPORT_FAILURE:
            return {
                ...state,
                importLoading: false,
                importError: action.payload.message,
                importResults: null,
                importValidationErrors: action.payload.validationErrors || []
            };

        // Clear actions
        case 'CLEAR_CONSUMPTION_BY_ID':
            return {
                ...state,
                selectedConsumption: null,
                selectedConsumptionError: null
            };

        case 'CLEAR_HISTORY_CONSUMPTION':
            return {
                ...state,
                historyConsumption: [],
                historyConsumptionError: null
            };

        case 'CLEAR_IMPORT_RESULTS':
            return {
                ...state,
                importResults: null,
                importError: null,
                importValidationErrors: []
            };

        case 'CLEAR_PUMP_TRANSACTIONS':
            return {
                ...state,
                pumpTransactions: [],
                pumpTransactionsError: null,
                pumpTransactionsLastFetch: null,
                pumpTransactionsFilters: null
            };

        case FETCH_PUMP_TRANSACTIONS_REQUEST:
            return {
                ...state,
                pumpTransactionsLoading: true,
                pumpTransactionsError: null,
                pumpTransactionsFilters: action.filters || null
            };

        case FETCH_PUMP_TRANSACTIONS_SUCCESS:
            return {
                ...state,
                pumpTransactions: action.payload,
                pumpTransactionsLoading: false,
                pumpTransactionsError: null,
                pumpTransactionsLastFetch: new Date().toISOString()
            };

        case FETCH_PUMP_TRANSACTIONS_FAILURE:
            return {
                ...state,
                pumpTransactions: [],
                pumpTransactionsLoading: false,
                pumpTransactionsError: action.payload,
                pumpTransactionsLastFetch: null
            };

        default:
            return state;
    }
};

export default consumptionReducer;