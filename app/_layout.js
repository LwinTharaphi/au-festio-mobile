import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GlobalProvider } from '../context/GlobalProvider';
import { View, Image, StyleSheet } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function Layout({ children }) {
  const [isReady, setIsReady] = useState(false); // State to track when app is ready to show content

  useEffect(() => {
    const prepareApp = async () => {
      // Simulate loading (e.g., API calls, asset loading, etc.)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay for splash screen
      setIsReady(true); // App is ready to show
      SplashScreen.hideAsync(); // Hide the splash screen manually after the delay
    };

    prepareApp();
  }, []);

  if (!isReady) {
    // While the app is preparing, show the splash screen image
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('../assets/images/image 80.png')} // Your splash screen image path
          style={styles.splashImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <GlobalProvider>
      <Stack>
        <Stack.Screen name='index' options={{ headerShown: false }} />
        <Stack.Screen name='(auth)' options={{ headerShown: false }} />
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      </Stack>
    </GlobalProvider>
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
