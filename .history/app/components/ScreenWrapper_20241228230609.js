import { View, Text, StatusBar } from 'react-native'
import React from 'react'
// for ios
export default function ScreenWrapper({children}) {
    let statusBarHeight = StatusBar.currentHeight;
  return (
    <View style={{paddingTop: statusBarHeight}}>
      {
        children
      }
    </View>
  )
}