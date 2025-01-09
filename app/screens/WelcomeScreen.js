import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'react-native'
import "../../global.css"
import { colors } from '../theme'
import { useNavigation } from '@react-navigation/native'

export default function WelcomeScreen() {
  const navigation = useNavigation()
  return (
    <SafeAreaView>
      <View className="h-full flex justify-around">
        <View className="flex-row justify-center mt-10">
          <Image source={require('../../assets/images/Group 303.png')} className="h-96 w-96 shadow" />
        </View>
        <View className="mx-5 mb-20">
          <Text className={`text-center font-bold text-4xl ${colors.heading} mb-5`}>Welcome to</Text>
          <Text className={`text-center font-bold text-4xl ${colors.heading} mb-10`}>AU Festio</Text>
          <TouchableOpacity className="shadow p-3 rounded-full mb-5" style={{backgroundColor: colors.button }} onPress={
                    () => navigation.navigate("SignIn")
                }>
                  <Text className="text-center text-lg font-bold text-yellow-50">Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}