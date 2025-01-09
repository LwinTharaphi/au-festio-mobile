import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import HomeScreen from '../screens/HomeScreen';
import SignUpScreen from '../screens/SignUpScreen';
// import MainTabNavigator from './BottomTabNavigator';
// import EventDetailScreen from '../screens/EventDetailScreen'; // Example screen outside tabs

// // const Stack = createStackNavigator();

// // export default function AppNavigator() {
// //   return (
// //     <Stack.Navigator>
// //       {/* Tabs will only show on these screens */}
// //       <Stack.Screen
// //         name="MainTabs"
// //         component={MainTabNavigator}
// //         options={{ headerShown: false }} // Hide header for tabs
// //       />
// //       {/* Other screens without tabs */}
// //       <Stack.Screen
// //         name="EventDetail"
// //         component={EventDetailScreen}
// //         options={{ headerShown: true }} // Show header for details
// //       />
// //     </Stack.Navigator>
// //   );
// // }

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (

    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen options={{presentation: 'modal'}} name="SignIn" component={SignInScreen} />
      <Stack.Screen options={{presentation: 'modal'}} name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />   
    </Stack.Navigator>

  )
}