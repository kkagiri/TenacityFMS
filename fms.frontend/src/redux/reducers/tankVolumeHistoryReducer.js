import {
    FETCH_TANK_VOLUME_HISTORY_SUCCESS,
    FETCH_TANK_VOLUME_HISTORY_FAILURE,
    FETCH_TANK_VOLUME_HISTORY_BY_ID_SUCCESS,
    FETCH_TANK_VOLUME_HISTORY_BY_ID_FAILURE,
    FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS,
    FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_FAILURE
} from '../actions/tankVolumeHistoryActions';

const initialState = {
    tankVolumeHistory: [],
    currentTankVolumeHistory: null,
    loading: false,
    error: null,
};

const tankVolumeHistoryReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TANK_VOLUME_HISTORY_SUCCESS:       
        case FETCH_TANK_VOLUME_HISTORY_BY_ID_SUCCESS:     
        case FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS:
            return { 
                ...state, 
                tankVolumeHistory: Array.isArray(action.payload) ? action.payload : [action.payload],                 loading: false, 
                error: null 
            };
        case FETCH_TANK_VOLUME_HISTORY_FAILURE:
        case FETCH_TANK_VOLUME_HISTORY_BY_ID_FAILURE:
        case FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_FAILURE:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export default tankVolumeHistoryReducer;