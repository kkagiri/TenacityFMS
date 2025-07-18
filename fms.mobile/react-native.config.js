module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: {
          sourceDir: '../node_modules/react-native-vector-icons/Fonts',
          project: 'ios/FMSMobile.xcodeproj',
        },
        android: {
          sourceDir: '../node_modules/react-native-vector-icons/Fonts',
          fontFamily: 'FontAwesome',
        },
      },
    },
  },
  assets: ['./src/assets/fonts/', './src/assets/images/'],
};