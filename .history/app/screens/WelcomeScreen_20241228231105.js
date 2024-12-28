import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'react-native'

export default function WelcomeScreen() {
  return (
    <SafeAreaView>
        <View>
            <View>
                <Image source={require('../../assets/react-logo.png')} />
            </View>
        </View>
    </SafeAreaView>
  )
}