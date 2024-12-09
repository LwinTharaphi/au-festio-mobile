import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import EventStackNavigator from './EventStackNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import LocationScreen from '../screens/LocationScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Events" component={EventStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Location" component={LocationScreen} />
    </Tab.Navigator>
  );
}
