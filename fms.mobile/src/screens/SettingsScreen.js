import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome5';
import {logoutUser} from '../redux/slices/authSlice';

const SettingsScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => dispatch(logoutUser())
        }
      ]
    );
  };

  const renderMenuItem = (icon, title, onPress, color = '#374151') => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.menuText, {color}]}>{title}</Text>
      <Icon name="chevron-right" size={16} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileInfo}>
          <Icon name="user-circle" size={60} color="#2563eb" />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || user?.username}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Settings Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        {renderMenuItem('user-cog', 'Profile Settings', () => {})}
        {renderMenuItem('bell', 'Notifications', () => {})}
        {renderMenuItem('shield-alt', 'Security', () => {})}
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>App</Text>
        {renderMenuItem('cog', 'Preferences', () => {})}
        {renderMenuItem('download', 'Offline Data', () => {})}
        {renderMenuItem('info-circle', 'About', () => {})}
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Support</Text>
        {renderMenuItem('question-circle', 'Help & Support', () => {})}
        {renderMenuItem('bug', 'Report Issue', () => {})}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        {renderMenuItem('sign-out-alt', 'Logout', handleLogout, '#dc2626')}
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>FMS Mobile v1.0.0</Text>
        <Text style={styles.copyright}>© 2024 Hyoung FMS</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: 'white',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  logoutSection: {
    backgroundColor: 'white',
    marginBottom: 20,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#9ca3af',
  },
  copyright: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default SettingsScreen;