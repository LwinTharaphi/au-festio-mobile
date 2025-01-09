import { View, Text } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

export default function SplashScreen() {
    const navigation = useNavigation()
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