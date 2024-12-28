import { View, Text, StatusBar } from 'react-native'
import React, { Children } from 'react'

export default function ScreenWrapper() {
    let statusBarHeight = StatusBar.currentHeight;
  return (
    <View style={{paddingTop: statusBarHeight}}>
      {
        childeren
      }
    </View>
  )
}