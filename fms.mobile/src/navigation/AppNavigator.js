//Cursor - Main navigation for FMS Mobile
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import DeviceListScreen from '../screens/DeviceListScreen';
import FuelingProcessScreen from '../screens/FuelingProcessScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import components
import {useSelector} from 'react-redux';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          switch (route.name) {
            case 'Devices':
              iconName = 'gas-pump';
              break;
            case 'History':
              iconName = 'history';
              break;
            case 'Settings':
              iconName = 'cog';
              break;
            default:
              iconName = 'question';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#1f2937',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}>
      <Tab.Screen
        name="Devices"
        component={DeviceListScreen}
        options={{title: 'FMS Devices'}}
      />
      <Tab.Screen
        name="History"
        component={TransactionHistoryScreen}
        options={{title: 'Transaction History'}}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: 'Settings'}}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1f2937',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>

      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="FuelingProcess"
            component={FuelingProcessScreen}
            options={{
              title: 'Fueling Process',
              headerBackTitleVisible: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;