import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import EventStackNavigator from './EventStackNavigator'; // Replace with your actual stack navigator
import ProfileScreen from '../screens/ProfileScreen';
import LocationScreen from '../screens/LocationScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
const Tab = createBottomTabNavigator();

export default function MainTabNavigator({route}) {
  const {user} = route.params;
  return (
    <Tab.Navigator>
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
        name="Profile"
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
