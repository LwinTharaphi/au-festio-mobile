// // import React from 'react';
// // import { NavigationContainer } from '@react-navigation/native';
// // import BottomTabNavigator from './navigation/BottomTabNavigator';

// // export default function App() {
// //   return (
// //     <NavigationContainer>
// //       <BottomTabNavigator />
// //     </NavigationContainer>
// //   );
// // }
// // import React from 'react';
// // import { NavigationContainer } from '@react-navigation/native';
// // import AppNavigator from './navigation/AppNavigator'; // Adjust path

// // export default function App() {
// //   return (
// //     <NavigationContainer>
// //       <AppNavigator />
// //     </NavigationContainer>
// //   );
// // }
import React, { useEffect } from 'react';
import "../global.css"
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';
import { View, Image, StyleSheet } from 'react-native';

export default function App() {
  const [isReady, setIsReady] = React.useState(false);
  useEffect(() => {
    const prepareApp = async () => {
      SplashScreen.preventAutoHideAsync();
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate a 2s wait
      setIsReady(true);
      SplashScreen.hideAsync();
    }
    prepareApp();
  }, []);
  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <Image source={require('../assets/images/image 80.png')} style={styles.splashImage} resizeMode="contain" />
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <AppNavigator /> {/* Navigation already includes NavigationContainer */}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Background color to match the splash screen image
  },
  splashImage: {
    width: 200, // You can adjust the width and height as per your image's size
    height: 200,
  },
});