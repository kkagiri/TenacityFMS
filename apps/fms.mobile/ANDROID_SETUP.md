
# FMS Mobile - Android Setup Guide

This guide will help you set up the FMS Mobile app for Android development.

## Prerequisites

1. **Node.js** (version 16 or newer)
2. **React Native CLI**
3. **Android Studio** (latest version)
4. **Java Development Kit (JDK)** version 11 or newer

## Android Development Environment Setup

### 1. Install Android Studio
1. Download Android Studio from https://developer.android.com/studio
2. Install with default settings
3. Open Android Studio and complete the setup wizard

### 2. Configure Android SDK
1. Open Android Studio
2. Go to **File > Settings** (Windows/Linux) or **Android Studio > Preferences** (macOS)
3. Navigate to **Appearance & Behavior > System Settings > Android SDK**
4. In **SDK Platforms** tab, install:
   - Android 13 (API level 33)
   - Android 12 (API level 31)
   - Android 11 (API level 30)
5. In **SDK Tools** tab, ensure these are installed:
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools
   - Google Play Services

### 3. Set Environment Variables

#### Windows
Add to your system environment variables:
```
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
```
Add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```


### 4. Create Android Virtual Device (AVD)
1. Open Android Studio
2. Go to **Tools > Device Manager**
3. Click **Create Device**
4. Select a device (e.g., Pixel 4)
5. Select system image (API level 30 or higher recommended)
6. Name your AVD (e.g., "FMS_Test_Device")
7. Click **Finish**

## Project Setup

### 1. Install Dependencies
```bash
cd fms.mobile
npm install
```

### 3. Android-specific Configuration

#### Update network_security_config.xml
Create `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">your-backend-domain.com</domain>
    </domain-config>
</network-security-config>
```

#### Update AndroidManifest.xml
Add network security config and permissions to `android/app/src/main/AndroidManifest.xml`:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Internet permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera permissions for QR scanning -->
    <uses-permission android:name="android.permission.CAMERA" />

    <!-- Storage permissions -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <!-- Location permissions (if needed) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <application
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="true"
        ... >

        <!-- Your existing application content -->

    </application>
</manifest>
```

### 4. Environment Configuration

Create a `.env` file in the project root:
```env
# For Android Emulator
API_BASE_URL=http://10.0.2.2:5000/api
SIGNALR_HUB_URL=http://10.0.2.2:5000/fuelingHub

# For Physical Android Device (replace with your computer's IP)
# API_BASE_URL=http://192.168.1.100:5000/api
# SIGNALR_HUB_URL=http://192.168.1.100:5000/fuelingHub

DEBUG_MODE=true
```

## Backend Integration Setup

### 1. Ensure Backend is Running
Make sure your FMS backend is running and accessible:
- Web API should be running on `http://localhost:5000`
- SignalR hub should be accessible at `/fuelingHub`

### 2. Test API Connectivity
You can test the API connection using:
```bash
# From your development machine
curl http://localhost:5000/api/health

# Test from Android emulator (use adb shell)
adb shell
curl http://10.0.2.2:5000/api/health
```

### 3. Configure CORS (Backend)
Ensure your backend allows requests from mobile clients. In your backend startup configuration:

```csharp
// In Startup.cs or Program.cs
services.AddCors(options =>
{
    options.AddPolicy("MobilePolicy", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Use the policy
app.UseCors("MobilePolicy");
```

## Running the App

### 1. Start Metro Bundler
```bash
npm start
# or
npx react-native start
```

### 2. Run on Android Emulator
```bash
npm run android
# or
npx react-native run-android
```

### 3. Run on Physical Device

#### Enable Developer Options
1. Go to **Settings > About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings > Developer Options**
4. Enable **USB Debugging**

#### Connect and Run
```bash
# Check if device is connected
adb devices

# Run the app
npm run android
```

## Troubleshooting

### Common Issues

#### 1. Metro Server Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Or manually clear
rm -rf node_modules/.cache
```

#### 2. Android Build Issues
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Rebuild
npm run android
```

#### 3. Network Connection Issues
- Check if backend is running
- Verify IP addresses in `.env` file
- For physical devices, ensure device and computer are on same network
- Check firewall settings

#### 4. Permission Issues
Make sure all required permissions are added to `AndroidManifest.xml`

### Debug Tools

#### 1. React Native Debugger
```bash
# Install
npm install -g react-native-debugger

# Open debugger
react-native-debugger
```

#### 2. Flipper
Flipper is included by default in React Native. Use it for:
- Network requests debugging
- Redux state inspection
- Performance monitoring

#### 3. ADB Logcat
```bash
# View device logs
adb logcat

# Filter for your app
adb logcat | grep "FMSMobile"
```

## Build for Release

### 1. Generate Signed APK
```bash
cd android
./gradlew assembleRelease
```

### 2. Generate AAB (for Play Store)
```bash
cd android
./gradlew bundleRelease
```

## Performance Optimization

### 1. Enable Hermes
Hermes is enabled by default in newer React Native versions. Verify in `android/app/build.gradle`:
```gradle
project.ext.react = [
    enableHermes: true
]
```

### 2. Optimize Images
- Use WebP format for images
- Implement lazy loading for large lists
- Use proper image sizes

### 3. Code Splitting
- Use React.lazy() for screen components
- Implement proper navigation structure

## Security Considerations

1. **API Security**: Always use HTTPS in production
2. **Certificate Pinning**: Implement for production builds
3. **Data Storage**: Use encrypted storage for sensitive data
4. **Code Obfuscation**: Enable ProGuard for release builds

## Next Steps

1. Test all features on different Android versions
2. Implement proper error handling
3. Add crash reporting (e.g., Crashlytics)
4. Set up CI/CD pipeline
5. Prepare for Play Store submission

For additional help, refer to:
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Android Developer Guide](https://developer.android.com/guide)
- Project README.md for app-specific instructions