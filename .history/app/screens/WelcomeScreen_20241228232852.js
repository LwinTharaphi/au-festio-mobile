import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'react-native'
import "../../global.css"

export default function WelcomeScreen() {
  return (
    <SafeAreaView>
        <View>
            <View className="flex-row justify-center mt-10">
                <Image source={require('../../assets/images/react-logo.png')} className="h-96 w-96 shadow" />
            </View>
            <View>
                <Text className="text-center font-bold text-4xl">AUFESTIO</Text>
            </View>
        </View>
    </SafeAreaView>
  )
}