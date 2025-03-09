//chatgpt: fuelingRuleReducer.js
import { FUELING_RULE_ACTIONS } from '../actions/fuelingRuleActions';

const initialState = {
  ruleSets: [],
  selectedRuleSet: null,
  loading: false,
  error: null,
};

const fuelingRuleReducer = (state = initialState, action) => {
  switch (action.type) {
    // ====== FETCH ALL RULESETS ======
    case FUELING_RULE_ACTIONS.FETCH_RULESETS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FUELING_RULE_ACTIONS.FETCH_RULESETS_SUCCESS:
      return {
        ...state,
        loading: false,
        ruleSets: action.payload,
        error: null,
      };
    case FUELING_RULE_ACTIONS.FETCH_RULESETS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // ====== FETCH SINGLE RULESET ======
    case FUELING_RULE_ACTIONS.FETCH_SINGLE_RULESET_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FUELING_RULE_ACTIONS.FETCH_SINGLE_RULESET_SUCCESS:
      return {
        ...state,
        loading: false,
        selectedRuleSet: action.payload,
        error: null,
      };
    case FUELING_RULE_ACTIONS.FETCH_SINGLE_RULESET_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // ====== CREATE / UPDATE / DELETE RULE SET ======
    case FUELING_RULE_ACTIONS.CREATE_RULESET_SUCCESS:
      return {
        ...state,
        ruleSets: [...state.ruleSets, action.payload],
      };
    case FUELING_RULE_ACTIONS.UPDATE_RULESET_SUCCESS:
      return {
        ...state,
        ruleSets: state.ruleSets.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case FUELING_RULE_ACTIONS.DELETE_RULESET_SUCCESS:
      return {
        ...state,
        ruleSets: state.ruleSets.filter((r) => r.id !== action.payload),
        selectedRuleSet:
          state.selectedRuleSet && state.selectedRuleSet.id === action.payload
            ? null
            : state.selectedRuleSet,
      };

    // ====== ASSIGN RULESET TO TAG ======
    case FUELING_RULE_ACTIONS.ASSIGN_RULESET_SUCCESS:
      // You could update the store if needed. Often you'd refresh data to see the updated assignment.
      return {
        ...state,
      };

    // ====== DAILY/MONTHLY, REFILL COUNT, TIME WINDOW RULES ======
    // For these, you might want to incorporate them inside the ruleSets array or the selectedRuleSet object.
    // Here's a simplistic approach that doesn't deeply update nested fields:
    case FUELING_RULE_ACTIONS.CREATE_DAILYMONTHLY_RULE_SUCCESS:
    case FUELING_RULE_ACTIONS.UPDATE_DAILYMONTHLY_RULE_SUCCESS:
    case FUELING_RULE_ACTIONS.DELETE_DAILYMONTHLY_RULE_SUCCESS:
    case FUELING_RULE_ACTIONS.CREATE_REFILLCOUNT_RULE_SUCCESS:
    case FUELING_RULE_ACTIONS.UPDATE_REFILLCOUNT_RULE_SUCCESS:
    case FUELING_RULE_ACTIONS.DELETE_REFILLCOUNT_RULE_SUCCESS:
    case FUELING_RULE_ACTIONS.CREATE_TIMEWINDOW_RULE_SUCCESS:
    case FUELING_RULE_ACTIONS.UPDATE_TIMEWINDOW_RULE_SUCCESS:
    case FUELING_RULE_ACTIONS.DELETE_TIMEWINDOW_RULE_SUCCESS:
      // You could handle more refined updates if the response returns the entire updated rule set.
      return {
        ...state,
      };

    default:
      return state;
  }
};

export default fuelingRuleReducer;
