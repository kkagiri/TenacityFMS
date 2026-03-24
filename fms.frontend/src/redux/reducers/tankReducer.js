import {
    FETCH_TANKS_SUCCESS,
    FETCH_TANKS_FAILURE,
    CREATE_TANK_SUCCESS,
    CREATE_TANK_FAILURE,
    UPDATE_TANK_SUCCESS,
    UPDATE_TANK_FAILURE,
    DELETE_TANK_SUCCESS,
    DELETE_TANK_FAILURE,
    FETCH_TANK_BY_SITE_ID_FAILURE,
    FETCH_TANK_BY_SITE_ID_SUCCESS,

} from '../actions/tankActions';

const initialState = {
    tanks: [],
    loading: true,
    error: null,
};

const tankReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TANKS_SUCCESS:
            return {
                ...state,
                tanks: action.payload,
                loading: false,
                error: null,
            };
        case FETCH_TANKS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case CREATE_TANK_SUCCESS:
            return {
                ...state,
                tanks: [...state.tanks, action.payload],
                loading: false,
                error: null,
            };
        case CREATE_TANK_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case UPDATE_TANK_SUCCESS:
            return {
                ...state,
                tanks: state.tanks.map(tank =>
                    tank.id === action.payload.id
                        ? { ...tank, ...action.payload.tank }
                        : tank
                ),
                loading: false,
                error: null,
            };
        case UPDATE_TANK_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case DELETE_TANK_SUCCESS:
            return {
                ...state,
                tanks: state.tanks.filter(tank => tank.id !== action.payload),
                loading: false,
                error: null,
            };
        case DELETE_TANK_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case FETCH_TANK_BY_SITE_ID_SUCCESS:
            return {
                ...state,
                tanks: action.payload,
                loading: false,
                error: null,
            };
        case FETCH_TANK_BY_SITE_ID_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        default:
            return state;
    }
};

export default tankReducer;
