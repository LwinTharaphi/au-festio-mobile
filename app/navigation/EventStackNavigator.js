import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EventDetailTabs from './EventDetailTabs';
import EventsScreen from '../screens/EventsScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NotificationStack from './NotificationStack';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function EventStackNavigator({route,navigation}) {
  const { expoPushToken, notification } = route.params || {};
  return (
    <Stack.Navigator>
      <Stack.Screen name="EventLists" component={EventsScreen} initialParams={{expoPushToken}} options={{headerShown: false, tabBarStyle: {display: 'none'}}} />
      {/* <Stack.Screen name="NotificationStack" component={NotificationStack} initialParams={{notification, expoPushToken}} options={{headerShown: false, tabBarStyle: {display: 'none'}}} /> */}
      <Stack.Screen
        name="EventDetail"
        component={EventDetailTabs}
        initialParams={{expoPushToken}}
        options={({navigation})=>({
          headerShown: false,
          tabBarStyle: { display: 'none' },
        })} 
      />
    </Stack.Navigator>
  );
}
