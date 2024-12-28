import { View, Text, StatusBar } from 'react-native'
import React, { Children } from 'react'

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