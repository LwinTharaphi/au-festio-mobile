import React, { useLayoutEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import EventStackNavigator from './EventStackNavigator'; // Replace with your actual stack navigator
import LocationScreen from '../screens/LocationScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import ARNavigationScreen from '../screens/ARNavigationScreen'; // Import the AR Navigation Screen
import { useNavigationState } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const LocationStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="LocationMap"
      component={LocationScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ARNavigation"
      component={ARNavigationScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default function MainTabNavigator({ route, navigation }) {
  const { user } = route.params || {};
  const navigationState = useNavigationState((state) => state) || {};

  const getNestedRouteName = (stage) => {
    if (!stage) return null;
    const route = stage.routes[stage.index];
    if (route.state) {
      return getNestedRouteName(route.state);
    }
    return route.name;
  };

  const currentRoute = getNestedRouteName(navigationState);
  const hideTabBarScreens = ['EventDetail', 'Details', 'Staffs', 'Booths', 'Schedule', 'Notification', 'ARNavigation'];

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { display: hideTabBarScreens.includes(currentRoute) ? 'none' : 'flex' },
      }}
    >
      <Tab.Screen
        name="Events"
        component={EventStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackNavigator}
        initialParams={{ user }}
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Location"
        component={LocationStack} // Use the LocationStack instead of LocationScreen
        options={{
          headerShown: false,
          tabBarLabel: 'Location',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}