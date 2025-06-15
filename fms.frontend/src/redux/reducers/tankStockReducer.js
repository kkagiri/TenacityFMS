import {
  FETCH_TANK_STOCKS_SUCCESS,
  FETCH_TANK_STOCKS_FAILURE,
  FETCH_TANK_STOCK_BY_ID_SUCCESS,
  FETCH_TANK_STOCK_BY_ID_FAILURE,
  CREATE_TANK_STOCK_SUCCESS,
  CREATE_TANK_STOCK_FAILURE,
  UPDATE_TANK_STOCK_SUCCESS,
  UPDATE_TANK_STOCK_FAILURE,
  DELETE_TANK_STOCK_SUCCESS,
  DELETE_TANK_STOCK_FAILURE,
  CREATE_OPENING_STOCK_SUCCESS,
  CREATE_OPENING_STOCK_FAILURE,
  CREATE_CLOSING_STOCK_SUCCESS,
  CREATE_CLOSING_STOCK_FAILURE,
  CREATE_DELIVERY_SUCCESS,
  CREATE_DELIVERY_FAILURE,
  FETCH_DELIVERIES_SUCCESS,
  FETCH_DELIVERIES_FAILURE,
  CREATE_TANK_TRANSFER_SUCCESS,
  CREATE_TANK_TRANSFER_FAILURE,
  FETCH_STOCK_DISCREPANCIES_REQUEST,
  FETCH_STOCK_DISCREPANCIES_SUCCESS,
  FETCH_STOCK_DISCREPANCIES_FAILURE

} from '../actions/tankStockAction';

const initialState = {
  tankStocks: [],
  currentTankStock: null,
  deliveries: [],
  stockDiscrepancies: [],
  discrepanciesLoading: false,
  loading: false,
  error: null,
};

const tankStockReducer = (state = initialState, action) => {
  switch (action.type) {
      case FETCH_TANK_STOCKS_SUCCESS:
          return { ...state, tankStocks: action.payload, loading: false, error: null };

          case CREATE_TANK_TRANSFER_SUCCESS:
            return { ...state, loading: false, error: null };

      case FETCH_TANK_STOCK_BY_ID_SUCCESS:
          return { ...state, currentTankStock: action.payload, loading: false, error: null };
      case CREATE_TANK_STOCK_SUCCESS:
          return { ...state, tankStocks: [...state.tankStocks, action.payload], loading: false, error: null };
      case UPDATE_TANK_STOCK_SUCCESS:
          return {
              ...state,
              tankStocks: state.tankStocks.map(stock => stock.id === action.payload.id ? action.payload : stock),
              loading: false,
              error: null
          };
      case DELETE_TANK_STOCK_SUCCESS:
          return {
              ...state,
              tankStocks: state.tankStocks.filter(stock => stock.id !== action.payload),
              loading: false,
              error: null
          };
      case CREATE_OPENING_STOCK_SUCCESS:
      case CREATE_CLOSING_STOCK_SUCCESS:
          return { ...state, loading: false, error: null };
      case CREATE_DELIVERY_SUCCESS:
          return { ...state, deliveries: [...state.deliveries, action.payload], loading: false, error: null };
      case FETCH_DELIVERIES_SUCCESS:
          return { ...state, deliveries: action.payload, loading: false, error: null };
      case FETCH_STOCK_DISCREPANCIES_REQUEST:
          return { ...state, discrepanciesLoading: true, error: null };
      case FETCH_STOCK_DISCREPANCIES_SUCCESS:
          return {
              ...state,
              stockDiscrepancies: action.payload,
              discrepanciesLoading: false,
              error: null
          };
      case FETCH_STOCK_DISCREPANCIES_FAILURE:
          return {
              ...state,
              stockDiscrepancies: [],
              discrepanciesLoading: false,
              error: action.payload
          };
      case FETCH_TANK_STOCKS_FAILURE:
      case FETCH_TANK_STOCK_BY_ID_FAILURE:
      case CREATE_TANK_STOCK_FAILURE:
      case UPDATE_TANK_STOCK_FAILURE:
      case DELETE_TANK_STOCK_FAILURE:
      case CREATE_OPENING_STOCK_FAILURE:
      case CREATE_CLOSING_STOCK_FAILURE:
      case CREATE_DELIVERY_FAILURE:

      case FETCH_DELIVERIES_FAILURE:
        case FETCH_TANK_STOCKS_FAILURE:

          return { ...state, loading: false, error: action.payload };
      default:
          return state;
  }
};

export default tankStockReducer;