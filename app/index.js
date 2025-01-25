// import 'expo-dev-client';
// import "nativewind/dev";  // Add this line for debugging
import React, { useEffect } from 'react';
import "../global.css"
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { useNavigation } from '@react-navigation/native';
import NotificationScreen from './screens/NotificationScreen';
// import { Provider } from 'react-redux';
// import { store } from './redux/store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if(Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push token:', token);
  return token;
}
export default function App() {
  const [isReady, setIsReady] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [expoPushToken, setExpoPushToken] = React.useState('');
  const [channels, setChannels] = React.useState([]);
  const [notification, setNotification] = React.useState(undefined);
  useEffect(() => {
    const prepareApp = async () => {
      SplashScreen.preventAutoHideAsync();
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate a 2s wait
      setIsReady(true);
      SplashScreen.hideAsync();
    }
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    prepareApp();
  }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // console.log('User state changed:', user);
      if (user) {
        await user.reload();
        console.log('Updated displayName after reload:', user.displayName);
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          emailVerified: user.emailVerified,
        });
      } else {
        console.log('User logged out');
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  if (!isReady || loading) {
    return (
      <View style={styles.splashContainer}>
        <Image source={require('../assets/images/au_festio_logo.jpg')} style={styles.splashImage} resizeMode="contain" />
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <AppNavigator user={user} expoPushToken={expoPushToken} notification={notification}/> 
    
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