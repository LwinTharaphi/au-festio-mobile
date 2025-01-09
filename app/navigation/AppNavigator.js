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

const Stack = createStackNavigator();

export default function AppNavigator() {
  const user = useSelector(state => state.user.user);

  const dispatch = useDispatch();

   // UseEffect to set up the auth state listener when the component mounts
   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userInfo = {
          name: user.displayName,
          email: user.email,
          uid: user.uid,
          emailVerified: user.emailVerified,
        };
        console.log('User logged in:', userInfo);
        dispatch(setUser(userInfo));
      } else {
        console.log('User logged out');
        dispatch(setUser(null));
      }
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, [dispatch]);
  if (user) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName='Home'>
        <Stack.Screen name="Home" component={HomeScreen} />
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