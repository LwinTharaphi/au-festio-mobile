import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EventsScreen from '../screens/EventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import EventDetailTabs from './EventDetailTabs';

const Stack = createStackNavigator();

export default function EventStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="Details" component={EventDetailTabs} />
    </Stack.Navigator>
  );
}
