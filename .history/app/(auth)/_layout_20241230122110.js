import { View, Text } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='signIn'
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name='signUp'
        options={{
          headerShown: false
        }}
      />
    </Stack>
  )
}