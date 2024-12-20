import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import EventDetailScreen from '../screens/EventDetailScreen';
import StaffsScreen from '../screens/StaffsScreen';
import BoothsScreen from '../screens/BoothsScreen';
import { Ionicons } from '@expo/vector-icons'; // Import icons

const Tab = createBottomTabNavigator();

export default function EventDetailTabs({ route }) {
  const { organizerId,eventId } = route.params; // Get eventId from route params
  
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Details"
        component={EventDetailScreen}
        initialParams={{ organizerId,eventId }}
        options={{
          tabBarLabel: 'Details',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Staffs"
        component={StaffsScreen}
        initialParams={{organizerId, eventId }}
        options={{
          tabBarLabel: 'Staffs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Booths"
        component={BoothsScreen}
        initialParams={{organizerId, eventId }}
        options={{
          tabBarLabel: 'Booths',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
