// supplierReducer.js
import {
    FETCH_SUPPLIERS_SUCCESS,
    FETCH_SUPPLIERS_FAILURE,
    CREATE_SUPPLIER_SUCCESS,
    CREATE_SUPPLIER_FAILURE,
    UPDATE_SUPPLIER_SUCCESS,
    UPDATE_SUPPLIER_FAILURE,
    DELETE_SUPPLIER_SUCCESS,
    DELETE_SUPPLIER_FAILURE
} from '../actions/SupplierActions';

const initialState = {
    suppliers: [],
    loading: false,
    error: null,
};

const supplierReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_SUPPLIERS_SUCCESS:
            return { ...state, suppliers: action.payload, loading: false, error: null };
        case CREATE_SUPPLIER_SUCCESS:
            return { ...state, suppliers: [...state.suppliers, action.payload], loading: false, error: null };
        case UPDATE_SUPPLIER_SUCCESS:
            return {
                ...state,
                suppliers: state.suppliers.map(supplier => 
                    supplier.id === action.payload.id ? action.payload : supplier
                ),
                loading: false,
                error: null
            };
        case DELETE_SUPPLIER_SUCCESS:
            return {
                ...state,
                suppliers: state.suppliers.filter(supplier => supplier.id !== action.payload),
                loading: false,
                error: null
            };
        case FETCH_SUPPLIERS_FAILURE:
        case CREATE_SUPPLIER_FAILURE:
        case UPDATE_SUPPLIER_FAILURE:
        case DELETE_SUPPLIER_FAILURE:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export default supplierReducer;