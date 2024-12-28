import { View, Text } from 'react-native'
import React from 'react'
import Navigation from '../navigation'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
export default function HomeScreen() {
  return (
    <SafeAreaView classname="bg-white">
        <StatusBar barStyle="dark-content" />
        <View classname="flex-row items-center justify-center h-full">
            <View classname="flex-col items-center">
            </View>
        </View>
    </SafeAreaView>
  )
}