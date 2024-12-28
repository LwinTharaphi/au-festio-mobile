import { View, Text } from 'react-native'
import React from 'react'
import Navigation from '../navigation'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as Icon from 'react-native-feather'
import { TextInput } from 'react-native-web'
export default function HomeScreen() {
  return (
    <SafeAreaView classname="bg-white">
        <StatusBar barStyle="dark-content" />
        <View classname="flex-row items-center space-x-2 px-4 pb-2">
            <View classname="flex-row flex-1 items-center p-3 rounded-full border border-gray-200 bg-gray-100">
                <Icon.Search height="25" width="25" stroke="gray" />
                <TextInput placeholder='Search for events' classname="flex-1 ml-2 bg-gray-100" />
            </View>
        </View>
    </SafeAreaView>
  )
}