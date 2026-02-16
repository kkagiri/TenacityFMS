import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";
import {
  loginUser,
  clearError,
  checkAuthStatus,
} from "../../redux/slices/authSlice";

const { width, height } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Check if user is already authenticated
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    // Clear any existing errors when component mounts
    dispatch(clearError());
  }, [dispatch]);

  // Navigation is handled automatically by AppNavigator based on isAuthenticated state
  // No need for manual navigation.replace here

  const validateForm = () => {
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(
        loginUser({
          username: username.toLowerCase().trim(),
          password: password,
          rememberMe,
        })
      ).unwrap();

      if (result.user) {
        Alert.alert(
          "Login Successful",
          `Welcome back, ${result.user.name || result.user.username}!`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error || "Invalid username or password. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Forgot Password",
      "Please contact your system administrator to reset your password.",
      [{ text: "OK" }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/hyoung-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Fuel Management System</Text>
          </View>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitleText}>Sign in to continue</Text>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="user"
              size={20}
              color="#6b7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput, errors.username && styles.inputError]}
              placeholder="Username"
              placeholderTextColor="#9ca3af"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors.username) {
                  setErrors((prev) => ({ ...prev, username: null }));
                }
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoCompleteType="username"
              textContentType="username"
            />
          </View>
          {errors.username && (
            <Text style={styles.errorText}>{errors.username}</Text>
          )}

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="lock"
              size={20}
              color="#6b7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput, errors.password && styles.inputError]}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: null }));
                }
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoCompleteType="password"
              textContentType="password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              <Icon
                name={showPassword ? "eye-slash" : "eye"}
                size={18}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Remember Me */}
          <TouchableOpacity
            style={styles.rememberContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <Icon
              name={rememberMe ? "check-square" : "square"}
              size={20}
              color={rememberMe ? "#2563eb" : "#6b7280"}
            />
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="exclamation-triangle" size={16} color="#dc2626" />
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Hyoung FMS. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
  },
  tagline: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    paddingVertical: 4,
  },
  inputError: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },
  passwordToggle: {
    padding: 4,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    marginBottom: 16,
    marginLeft: 4,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#374151",
  },
  loginButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  forgotPasswordButton: {
    alignItems: "center",
    marginTop: 16,
  },
  forgotPasswordText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorMessage: {
    color: "#dc2626",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    color: "#9ca3af",
    fontSize: 12,
  },
});

export default LoginScreen;
