import React, { useLayoutEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import EventStackNavigator from './EventStackNavigator';
import LocationScreen from '../screens/LocationScreen';
import CameraScreen from '../screens/CameraScreen';
import ARCamera from '../screens/ARCamera';
import ProfileStackNavigator from './ProfileStackNavigator';
import { useNavigationState } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator({ route, navigation }) {
  const { user, expoPushToken, notification } = route.params;
  const navigationState = useNavigationState((state) => state);

  const getNestedRouteName = (stage) => {
    if (!stage) return null;

    const route = stage.routes[stage.index];
    if (route.state) {
      return getNestedRouteName(route.state);
    }
    return route.name;
  };

  const currentRoute = getNestedRouteName(navigationState);
  const hideTabBarScreens = ['EventDetail', 'Details', 'Staffs', 'Booths', 'Notification', 'NotificationDetail','Schedule'];

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { display: hideTabBarScreens.includes(currentRoute) ? 'none' : 'flex' },
      }}>
      <Tab.Screen
        name="Events"
        component={EventStackNavigator}
        initialParams={{ expoPushToken, notification }}
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
        component={LocationScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Location',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Camera',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ARCamera"
        component={ARCamera}
        options={{
          headerShown: false,
          tabBarLabel: 'ARCamera',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="aperture-outline" size={size} color={color} />
          ),
        }}
      />

    </Tab.Navigator>
  );
}