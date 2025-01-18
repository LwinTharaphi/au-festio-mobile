import React, { useLayoutEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import EventStackNavigator from './EventStackNavigator'; // Replace with your actual stack navigator
import LocationScreen from '../screens/LocationScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import { useNavigationState } from '@react-navigation/native';
const Tab = createBottomTabNavigator();

export default function MainTabNavigator({route, navigation}) {
  const {user} = route.params;
  const navigationState = useNavigationState((state) => state);

  const getNestedRouteName = (stage)=>{
    if(!stage) return null;

    const route = stage.routes[stage.index];
    // console.log("route", route);

    if(route.state){
      return getNestedRouteName(route.state);
    }
    return route.name;
  }

  const currentRoute = getNestedRouteName(navigationState);
  console.log("currentRoute", currentRoute);

  const hideTabBarScreens = ['EventDetail','Details','Staffs','Booths'];

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { display: hideTabBarScreens.includes(currentRoute) ? 'none' : 'flex' }, // Hide the tab bar for Details, Staffs, and Booths
      }}>
      <Tab.Screen
        name="Events"
        component={EventStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} /> // Icon for Events
          ),
        }}
      />
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackNavigator}
        initialParams={{user}}
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} /> // Icon for Profile
          ),
        }}
      />
      <Tab.Screen
        name="Location"
        component={LocationScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Location',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} /> // Icon for Location
          ),
        }}
      />
    </Tab.Navigator>
  );
}
