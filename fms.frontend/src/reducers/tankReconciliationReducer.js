const initialState = {
    reconciliations: [],
    loading: false,
    error: null,
  };
  
  const tankReconciliationReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_TANK_RECONCILIATION_SUCCESS:
      case FETCH_TANK_RECONCILIATION_BY_SITE_SUCCESS:
        return { ...state, reconciliations: action.payload, loading: false, error: null };
      case FETCH_TANK_RECONCILIATION_FAILURE:
      case FETCH_TANK_RECONCILIATION_BY_SITE_FAILURE:
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };
  
  export default tankReconciliationReducer;