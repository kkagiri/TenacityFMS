# Authentication - FMS Mobile

## Overview

The FMS Mobile application implements JWT-based authentication with token persistence, automatic session restoration, and refresh token support.

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  App Launch                                                     │
│      │                                                          │
│      ▼                                                          │
│  ┌──────────────────┐                                          │
│  │ Check Stored     │                                          │
│  │ Token            │                                          │
│  └──────────────────┘                                          │
│      │                                                          │
│      ├──── Token Found ────►  Validate ──► Valid ──► MainTabs  │
│      │                            │                             │
│      │                            ▼                             │
│      │                        Invalid                           │
│      │                            │                             │
│      ▼                            ▼                             │
│  No Token ─────────────────► LoginScreen                       │
│                                   │                             │
│                                   ▼                             │
│                              User Login                         │
│                                   │                             │
│                                   ▼                             │
│                          ┌──────────────┐                       │
│                          │ API: Login   │                       │
│                          └──────────────┘                       │
│                                   │                             │
│                        ┌──────────┴──────────┐                  │
│                        │                      │                  │
│                     Success                 Failure              │
│                        │                      │                  │
│                        ▼                      ▼                  │
│                  Store Tokens            Show Error              │
│                  Navigate to MainTabs                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation

### Auth Slice (Redux)

**Location:** `src/redux/slices/authSlice.js`

```javascript
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  masterTag: null,
  preferences: {
    rememberLogin: false,
    biometricEnabled: false,
    notifications: true,
  }
};
```

### Async Thunks

#### Login

```javascript
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await ApiService.login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

#### Logout

```javascript
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await ApiService.logout();
      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

#### Check Auth Status

```javascript
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (token && userData) {
        return {
          token,
          user: JSON.parse(userData),
          isAuthenticated: true
        };
      }
      return {
        token: null,
        user: null,
        isAuthenticated: false
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

## Login Screen

**Location:** `src/screens/LoginScreen.js`

### Features

- Username/password form
- Form validation
- Remember me option
- Password visibility toggle
- Error display
- Loading state

### Validation Rules

| Field | Rules |
|-------|-------|
| Username | Required, min 3 characters |
| Password | Required, min 4 characters |

### Usage

```javascript
const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('MainTabs');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(loginUser({
        username: username.toLowerCase().trim(),
        password: password,
        rememberMe
      })).unwrap();
    } catch (error) {
      Alert.alert('Login Failed', error);
    }
  };

  // ... render
};
```

## API Service

**Location:** `src/services/apiService.js`

### Login Endpoint

```javascript
async login(credentials) {
  try {
    const response = await this.api.post('/auth/login', credentials);
    if (response.data.token) {
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw this.handleError(error, 'Login failed');
  }
}
```

### Token Interceptor

```javascript
this.api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

### 401 Handler

```javascript
this.api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - clear storage
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      // Dispatch logout would be handled by calling component
    }
    return Promise.reject(error);
  }
);
```

## Token Storage

| Key | Content | Purpose |
|-----|---------|---------|
| `auth_token` | JWT access token | API authentication |
| `user_data` | JSON user object | User info display |
| `refresh_token` | Refresh token | Token renewal |

## Navigation Guard

**Location:** `src/navigation/AppNavigator.js`

```javascript
const AppNavigator = () => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
};
```

## User Data Structure

```javascript
{
  id: string,
  username: string,
  name: string,
  email: string,
  role: string,
  permissions: string[],
  masterTag: string,        // For fueling authorization
  siteId: string,          // Assigned site
  preferences: {
    language: string,
    timezone: string
  }
}
```

## Logout Flow

```javascript
const handleLogout = async () => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          // Stop SignalR connection
          await signalRService.stop();

          // Dispatch logout
          await dispatch(logoutUser());

          // Navigation will auto-redirect to Login via AppNavigator
        }
      }
    ]
  );
};
```

## Security Considerations

### Token Security

- Tokens stored in AsyncStorage (encrypted on device)
- Token included only in Authorization header
- No token in URL params

### Session Management

- Auto-logout on 401 response
- Session check on app resume
- Clear all auth data on logout

### Future Enhancements

- Biometric authentication
- PIN code option
- Token refresh flow
- Offline mode with cached credentials

## Testing Checklist

- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials shows error
- [ ] Form validation prevents empty submission
- [ ] Remember me persists username
- [ ] Logout clears all auth data
- [ ] App resume restores session
- [ ] 401 response triggers logout
- [ ] Password visibility toggle works

## Related Files

- `services/apiService.js` - API client
- `redux/slices/authSlice.js` - State management
- `navigation/AppNavigator.js` - Auth routing
