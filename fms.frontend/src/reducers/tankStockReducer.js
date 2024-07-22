const initialState = {
    tankStocks: [],
    loading: false,
    error: null,
  };
  
  const tankStockReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_TANK_STOCKS_SUCCESS:
        return { ...state, tankStocks: action.payload, loading: false, error: null };
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
      case FETCH_TANK_STOCKS_FAILURE:
      case CREATE_TANK_STOCK_FAILURE:
      case UPDATE_TANK_STOCK_FAILURE:
      case DELETE_TANK_STOCK_FAILURE:
      case CREATE_OPENING_STOCK_FAILURE:
      case CREATE_CLOSING_STOCK_FAILURE:
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };
  
  export default tankStockReducer;