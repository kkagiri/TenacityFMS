import {
    FETCH_TANK_STOCKS_SUCCESS,
    FETCH_TANK_STOCKS_FAILURE,
    CREATE_TANK_STOCK_SUCCESS,
    CREATE_TANK_STOCK_FAILURE,
    UPDATE_TANK_STOCK_SUCCESS,
    UPDATE_TANK_STOCK_FAILURE,
    DELETE_TANK_STOCK_SUCCESS,
    DELETE_TANK_STOCK_FAILURE
} from './../actions/tankStockAction';

const initialState = {
    tankStocks: [],
    loading: true,
    error: null,
};

const tankStockReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TANK_STOCKS_SUCCESS:
            return {
                ...state,
                tankStocks: action.payload,
                loading: false,
                error: null,
            };
        case FETCH_TANK_STOCKS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case CREATE_TANK_STOCK_SUCCESS:
            return {
                ...state,
                tankStocks: [...state.tankStocks, action.payload],
                loading: false,
                error: null,
            };
        case CREATE_TANK_STOCK_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case UPDATE_TANK_STOCK_SUCCESS:
            return {
                ...state,
                tankStocks: state.tankStocks.map(tankStock =>
                    tankStock.id === action.payload.id ? action.payload.tankStock : tankStock
                ),
                loading: false,
                error: null,
            };
        case UPDATE_TANK_STOCK_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case DELETE_TANK_STOCK_SUCCESS:
            return {
                ...state,
                tankStocks: state.tankStocks.filter(tankStock => tankStock.id !== action.payload),
                loading: false,
                error: null,
            };
        case DELETE_TANK_STOCK_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        default:
            return state;
    }
};

export default tankStockReducer;
