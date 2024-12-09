import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import StaffsScreen from './StaffsScreen';
import BoothsScreen from './BoothsScreen';

const Tab = createBottomTabNavigator();

export default function EventDetailScreen({ route }) {
  const { eventId } = route.params;

  return (
    <Tab.Navigator>
      <Tab.Screen name="Staffs" component={StaffsScreen} initialParams={{ eventId }} />
      <Tab.Screen name="Booths" component={BoothsScreen} initialParams={{ eventId }} />
    </Tab.Navigator>
  );
}
