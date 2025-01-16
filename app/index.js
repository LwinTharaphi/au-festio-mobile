// import 'expo-dev-client';
// import "nativewind/dev";  // Add this line for debugging
import React, { useEffect } from 'react';
import "../global.css"
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';
import { View, Image, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './redux/store';

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
        <Image source={require('../assets/images/au_festio_logo.jpg')} style={styles.splashImage} resizeMode="contain" />
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AppNavigator /> 
      </Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  splashImage: {
    width: 200, 
    height: 200,
  },
});