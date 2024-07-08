import { 
  FETCH_EMPLOYEES_REQUEST,
  FETCH_EMPLOYEES_SUCCESS,
  FETCH_EMPLOYEES_FAILURE,
  FETCH_EMPLOYEE_REQUEST,
  FETCH_EMPLOYEE_SUCCESS,
  FETCH_EMPLOYEE_FAILURE,
  CREATE_EMPLOYEE_REQUEST,
  CREATE_EMPLOYEE_SUCCESS,
  CREATE_EMPLOYEE_FAILURE,
  UPDATE_EMPLOYEE_REQUEST,
  UPDATE_EMPLOYEE_SUCCESS,
  UPDATE_EMPLOYEE_FAILURE,
  DELETE_EMPLOYEE_REQUEST,
  DELETE_EMPLOYEE_SUCCESS,
  DELETE_EMPLOYEE_FAILURE
} from '../actions/employeeActions'; 

const initialState = {
  employees: [],
  currentEmployee: null,
  loading: false,
  error: null,
};

const employeeReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_EMPLOYEES_REQUEST:
    case FETCH_EMPLOYEE_REQUEST:
    case CREATE_EMPLOYEE_REQUEST:
    case UPDATE_EMPLOYEE_REQUEST:
    case DELETE_EMPLOYEE_REQUEST:
      return { ...state, loading: true, error: null };

    case FETCH_EMPLOYEES_SUCCESS:
      return { ...state, loading: false, employees: action.payload };

    case FETCH_EMPLOYEE_SUCCESS:
      return { ...state, loading: false, currentEmployee: action.payload };

    case CREATE_EMPLOYEE_SUCCESS:
      return {
        ...state,
        loading: false,
        employees: [...state.employees, action.payload],
      };

    case UPDATE_EMPLOYEE_SUCCESS:
      return {
        ...state,
        loading: false,
        employees: state.employees.map((employee) =>
          employee.id === action.payload.id ? action.payload : employee
        ),
        currentEmployee: action.payload,
      };

    case DELETE_EMPLOYEE_SUCCESS:
      return {
        ...state,
        loading: false,
        employees: state.employees.filter((employee) => employee.id !== action.payload),
      };

    case FETCH_EMPLOYEES_FAILURE:
    case FETCH_EMPLOYEE_FAILURE:
    case CREATE_EMPLOYEE_FAILURE:
    case UPDATE_EMPLOYEE_FAILURE:
    case DELETE_EMPLOYEE_FAILURE:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export default employeeReducer;