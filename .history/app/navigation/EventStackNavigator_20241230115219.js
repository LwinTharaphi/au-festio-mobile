import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EventDetailTabs from './EventDetailTabs';
import EventsScreen from '../screens/EventsScreen';
import { NavigationContainer } from '@react-navigation/native';

const Stack = createStackNavigator();

export default function EventStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Events" component={EventsScreen} options={{headerShown: false}} />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailTabs}
        options={{ headerShown: false, tabBarStyle: { display: 'none' } }} // Hide tabs
      />
    </Stack.Navigator>
  );
}
