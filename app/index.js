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
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
// import { Provider } from 'react-redux';
// import { store } from './redux/store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const BACKGROUND_TASK = 'background-notification-fetch';

TaskManager.defineTask(BACKGROUND_TASK, async () => {
  console.log('Background task executed');
  try {
    await scheduleNotificationAsync();
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return BackgroundFetch.Result.Failed;
  }
});

const registerBackgroundFetch = async () => {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.Status.Available) {
    console.log('Background fetch is available');
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
      minimumInterval: 15 * 60, // 15 minute
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background fetch registered');
  } else {
    console.log('Background fetch is not available:', status);
  }
}

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
  const notificationListener = React.useRef();
  const responseListener = React.useRef();

  useEffect(() => {
    const prepareApp = async () => {
      SplashScreen.preventAutoHideAsync();
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate a 2s wait
      setIsReady(true);
      SplashScreen.hideAsync();
    }
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
    registerBackgroundFetch();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log("Notification received: ", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification response received: ", response);
      const { eventId } = response.notification.request.content.data;
      console.log("Event ID: ", eventId);
    });

    prepareApp();
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }

      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    }
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