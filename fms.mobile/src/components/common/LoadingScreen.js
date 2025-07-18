//Cursor - Loading screen component for mobile app
import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';

const LoadingScreen = ({message = 'Loading...'}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default LoadingScreen;