import { TAG_ACTIONS } from "../actions/tagActions";

const initialState = {
  tags: [],
  tagsByVehicle: {}, // Map of vehicleId -> tags array
  tagDetails: {}, // Map of tagId -> tag details
  validatedTag: null, // Currently validated tag
  selectedTag: null,
  loading: false,
  error: null,
  validatedVehicle: null, // Currently validated vehicle
};

const tagReducer = (state = initialState, action) => {
  switch (action.type) {
    case TAG_ACTIONS.FETCH_TAGS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case TAG_ACTIONS.VALIDATE_VEHICLE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        validatedVehicle: null,
      };
    case TAG_ACTIONS.VALIDATE_VEHICLE_SUCCESS:
      return {
        ...state,
        validatedVehicle: action.payload,
        loading: false,
        error: null,
      };
    case TAG_ACTIONS.VALIDATE_VEHICLE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        validatedVehicle: null,
      };

    case TAG_ACTIONS.FETCH_TAGS_SUCCESS:
      return {
        ...state,
        loading: false,
        tags: action.payload,
        error: null,
      };

    case TAG_ACTIONS.FETCH_TAGS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case TAG_ACTIONS.SET_SELECTED_TAG:
      return {
        ...state,
        selectedTag: action.payload,
      };

    case TAG_ACTIONS.CREATE_TAG_SUCCESS:
      return {
        ...state,
        tags: [...state.tags, action.payload],
      };

    case TAG_ACTIONS.UPDATE_TAG_SUCCESS:
      return {
        ...state,
        tags: state.tags.map((tag) =>
          tag.id === action.payload.id ? action.payload : tag
        ),
      };

    case TAG_ACTIONS.DELETE_TAG_SUCCESS:
      return {
        ...state,
        tags: state.tags.filter((tag) => tag.id !== action.payload),
        selectedTag:
          state.selectedTag?.id === action.payload ? null : state.selectedTag,
      };

    case TAG_ACTIONS.ASSIGN_TAG_SUCCESS:
      // We might need to update the tag or the tags list
      return state;

    // New action handlers
    case TAG_ACTIONS.FETCH_TAGS_BY_VEHICLE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case TAG_ACTIONS.FETCH_TAGS_BY_VEHICLE_SUCCESS:
      return {
        ...state,
        tagsByVehicle: {
          ...state.tagsByVehicle,
          [action.payload.vehicleId]: action.payload.tags,
        },
        loading: false,
        error: null,
      };

    case TAG_ACTIONS.FETCH_TAGS_BY_VEHICLE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case TAG_ACTIONS.FETCH_TAG_DETAILS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case TAG_ACTIONS.FETCH_TAG_DETAILS_SUCCESS:
      return {
        ...state,
        tagDetails: {
          ...state.tagDetails,
          [action.payload.tagId]: action.payload,
        },
        loading: false,
        error: null,
      };

    case TAG_ACTIONS.FETCH_TAG_DETAILS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case TAG_ACTIONS.VALIDATE_TAG_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        validatedTag: null,
      };

    case TAG_ACTIONS.VALIDATE_TAG_SUCCESS:
      return {
        ...state,
        validatedTag: action.payload,
        loading: false,
        error: null,
      };

    case TAG_ACTIONS.VALIDATE_TAG_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        validatedTag: null,
      };

    default:
      return state;
  }
};

export default tagReducer;
