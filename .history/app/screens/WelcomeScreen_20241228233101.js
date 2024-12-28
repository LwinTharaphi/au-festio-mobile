import { View, Text, TouchableOpacity } from 'react-native'
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
                <Text className="text-center font-bold text-4xl mt-10 mb-10">AUFESTIO</Text>
                <TouchableOpacity>
                    <Text className="text-center text-white text-lg font-bold">Sign In</Text>
                </TouchableOpacity>
            </View>
        </View>
    </SafeAreaView>
  )
}