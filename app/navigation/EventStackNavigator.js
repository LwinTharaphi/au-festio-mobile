import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EventDetailTabs from './EventDetailTabs';
import EventsScreen from '../screens/EventsScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function EventStackNavigator({route,navigation}) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="EventLists" component={EventsScreen} options={{headerShown: false, tabBarStyle: {display: 'none'}}} />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailTabs}
        options={({navigation})=>({
          headerShown: false,
          tabBarStyle: { display: 'none' },
        })} 
      />
    </Stack.Navigator>
  );
}
