import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'react-native'
import import "../../global.css"

export default function WelcomeScreen() {
  return (
    <SafeAreaView>
        <View>
            <View classname="flex-row justify-center mt-10">
                <Image source={require('../../assets/images/react-logo.png')} classname="h-96 w-96 shadow" />
            </View>
            <View>
                <Text classname="text-center font-bold text-4xl">AUFESTIO</Text>
            </View>
        </View>
    </SafeAreaView>
  )
}