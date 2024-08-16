import { combineReducers } from 'redux';
import authReducer from './authReducer';
import permissionReducer from './permissionReducer';
import roleReducer from './roleReducer';

export default combineReducers({
    auth: authReducer,
    permission: permissionReducer,
    role: roleReducer
});
 