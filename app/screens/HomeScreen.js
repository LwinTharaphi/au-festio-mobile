import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LocationScreen from './LocationScreen';
import ProfileScreen from './ProfileScreen';

// Define the bottom tab navigator
const Tab = createBottomTabNavigator();

// HomeScreen component with Bottom Tab Navigator
const HomeScreen = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeDetailScreen} />
      <Tab.Screen name="Location" component={LocationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// HomeDetailScreen (Content for the Home Tab)
const HomeDetailScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>This is the Home Screen</Text>
  </View>
);

export default HomeScreen;
