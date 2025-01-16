import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import HomeScreen from '../screens/HomeScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { useSelector, useDispatch } from 'react-redux';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { auth } from '../config/firebase'
import { setUser } from '../redux/slice/user'
import MainTabNavigator from './BottomTabNavigator'

const Stack = createStackNavigator();

export default function AppNavigator() {
  const {user}= useSelector(state => state.user);

  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('User state changed:', user);
      if (user) {
        dispatch(setUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName || '',
          emailVerified: user.emailVerified,
        }));
      } else {
        console.log('User logged out');
        dispatch(setUser(null));
      }
    });
  
    return () => unsubscribe();
  }, [dispatch]);
  
  console.log('Current user:', user);
  if (user) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName='MainTabs'>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      </Stack.Navigator>
    )
  } else {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen options={{presentation: 'modal'}} name="SignIn" component={SignInScreen} />
        <Stack.Screen options={{presentation: 'modal'}} name="SignUp" component={SignUpScreen} />
      </Stack.Navigator>
    )
  }
}