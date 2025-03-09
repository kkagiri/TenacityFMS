import { TAG_ACTIONS } from '../actions/tagActions';

const initialState = {
    tags: [],
    selectedTag: null,
    loading: false,
    error: null
};

const tagReducer = (state = initialState, action) => {
    switch (action.type) {
        case TAG_ACTIONS.FETCH_TAGS_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };

        case TAG_ACTIONS.FETCH_TAGS_SUCCESS:
            return {
                ...state,
                loading: false,
                tags: action.payload,
                error: null
            };

        case TAG_ACTIONS.FETCH_TAGS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };

        case TAG_ACTIONS.SET_SELECTED_TAG:
            return {
                ...state,
                selectedTag: action.payload
            };

        case TAG_ACTIONS.CREATE_TAG_SUCCESS:
            return {
                ...state,
                tags: [...state.tags, action.payload]
            };

        case TAG_ACTIONS.UPDATE_TAG_SUCCESS:
            return {
                ...state,
                tags: state.tags.map(tag =>
                    tag.id === action.payload.id ? action.payload : tag
                )
            };

        case TAG_ACTIONS.DELETE_TAG_SUCCESS:
            return {
                ...state,
                tags: state.tags.filter(tag => tag.id !== action.payload),
                selectedTag: state.selectedTag?.id === action.payload ? null : state.selectedTag
            };

        default:
            return state;
    }
};

export default tagReducer;