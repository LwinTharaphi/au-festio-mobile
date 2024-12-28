import { View, Text } from 'react-native'
import React from 'react'

export default function WelcomeScreen() {
  return (
    <SafeAreaView>
        <View>
            <View>
                <Image source={require('../assets/react-logo.png')} />
            </View>
        </View>
    </SafeAreaView>
  )
}