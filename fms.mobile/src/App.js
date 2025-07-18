import React, {useEffect} from 'react';
import {StatusBar, LogBox} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {Provider, useDispatch} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import Toast from 'react-native-toast-message';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {store, persistor} from './redux/store';
import AppNavigator from './navigation/AppNavigator';
import LoadingScreen from './components/common/LoadingScreen';
import {checkAuthStatus} from './redux/slices/authSlice';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Remote debugger',
]);

const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
            <AppNavigator />
            <Toast />
          </NavigationContainer>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;