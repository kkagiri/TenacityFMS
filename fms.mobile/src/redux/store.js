import {configureStore, combineReducers} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers
import authReducer from './slices/authSlice';
import deviceReducer from './slices/deviceSlice';
import fuelingReducer from './slices/fuelingSlice';
import vehicleReducer from './slices/vehicleSlice';
import tagReducer from './slices/tagSlice';
import siteReducer from './slices/siteSlice';
import fuelingEventReducer from './slices/fuelingEventSlice';
import transactionReducer from './slices/transactionSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'device', 'site'], // Only persist essential data
  blacklist: ['fueling'], // Don't persist real-time fueling data
};

const rootReducer = combineReducers({
  auth: authReducer,
  device: deviceReducer,
  fueling: fuelingReducer,
  vehicle: vehicleReducer,
  tag: tagReducer,
  site: siteReducer,
  fuelingEvent: fuelingEventReducer,
  transaction: transactionReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;