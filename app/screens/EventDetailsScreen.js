import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import StaffsScreen from './StaffsScreen';
import BoothsScreen from './BoothsScreen';

const Tab = createBottomTabNavigator();

const EventDetailsScreen = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Details" component={DetailsScreen} />
      <Tab.Screen name="Staffs" component={StaffsScreen} />
      <Tab.Screen name="Booths" component={BoothsScreen} />
    </Tab.Navigator>
  );
};

const DetailsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>This is event detail</Text>
  </View>
);

export default EventDetailsScreen;
