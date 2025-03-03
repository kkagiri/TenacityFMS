import { configureStore } from '@reduxjs/toolkit';
import { thunk } from 'redux-thunk';
import { cloneDeep } from 'lodash';
import rootReducer from './redux/reducers';


const deepFreeze = (obj) => {
  Object.keys(obj).forEach(prop => {
    if (typeof obj[prop] === 'object' && !Object.isFrozen(obj[prop])) deepFreeze(obj[prop]);
  });
  return Object.freeze(obj);
};

const checkMutations = store => next => action => {
  const prevState = deepFreeze(cloneDeep(store.getState()));
  const result = next(action);
  const nextState = store.getState();


  return result;
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk, checkMutations),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;