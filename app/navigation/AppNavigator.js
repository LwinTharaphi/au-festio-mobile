import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import HomeScreen from '../screens/HomeScreen';
import SignUpScreen from '../screens/SignUpScreen';
import RegistrationSuccessScreen from '../screens/RegistrationSuccessScreen';
import { useSelector, useDispatch } from 'react-redux';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { auth } from '../config/firebase'
import { setUser, logoutUser } from '../redux/slice/user'
import MainTabNavigator from './BottomTabNavigator'
import EventDetailScreen from '../screens/EventDetailScreen';

const Stack = createStackNavigator();

export default function AppNavigator({user}) {
  // const {user}= useSelector(state => state.user);
  // console.log("user in app navigator: ", user);

  // const dispatch = useDispatch();

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, async (user) => {
  //     console.log('User state changed:', user);
  //     if (user) {
  //       await user.reload();
  //       dispatch(setUser({
  //         uid: user.uid,
  //         email: user.email,
  //         displayName: user.displayName || '',
  //         emailVerified: user.emailVerified,
  //       }));
  //     } else {
  //       console.log('User logged out');
  //       dispatch(logoutUser());
  //     }
  //   });
  
  //   return () => unsubscribe();
  // }, [dispatch]);
  
  // console.log('Current user:', user);
  if (user) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName='MainTabs'>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} initialParams={{user}}/>
        <Stack.Screen options={{presentation: 'modal'}} name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen options={{ presentation: 'modal' }} name="RegistrationSuccess" component={RegistrationSuccessScreen}
      />
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