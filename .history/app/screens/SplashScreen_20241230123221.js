import { View, Text } from 'react-native'
import React from 'react'

export default function SplashScreen() {
    const timer = setTimeout(() => {
        clearTimeout(timer)
        navigation.navigate('Welcome')
    }, 3000)
  return (
    <View>
      <Text>SplashScreen</Text>
    </View>
  )
}