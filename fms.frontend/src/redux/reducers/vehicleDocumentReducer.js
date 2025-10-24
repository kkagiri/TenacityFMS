import {
    FETCH_VEHICLE_DOCUMENTS_SUCCESS,
    FETCH_VEHICLE_DOCUMENTS_FAILURE,
    CREATE_VEHICLE_DOCUMENT_SUCCESS,
    UPDATE_VEHICLE_DOCUMENT_SUCCESS,
    DELETE_VEHICLE_DOCUMENT_SUCCESS
} from '../actions/vehicleDocumentActions';

const initialState = {
    documents: [],
    error: null
};

const vehicleDocumentReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_VEHICLE_DOCUMENTS_SUCCESS:
            return {
                ...state,
                documents: action.payload,
                error: null
            };
        case FETCH_VEHICLE_DOCUMENTS_FAILURE:
            return {
                ...state,
                error: action.payload
            };
        case CREATE_VEHICLE_DOCUMENT_SUCCESS:
            return {
                ...state,
                documents: [...state.documents, action.payload]
            };
        case UPDATE_VEHICLE_DOCUMENT_SUCCESS:
            return {
                ...state,
                documents: state.documents.map(doc =>
                    doc.id === action.payload.id ? action.payload : doc
                )
            };
        case DELETE_VEHICLE_DOCUMENT_SUCCESS:
            return {
                ...state,
                documents: state.documents.filter(doc => doc.id !== action.payload)
            };
        default:
            return state;
    }
};

export default vehicleDocumentReducer;
