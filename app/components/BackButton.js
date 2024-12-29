import { View, Text , TouchableOpacity} from 'react-native'
import React from 'react'
import { ChevronLeftIcon } from 'react-native-heroicons/outline'

export default function BackButton() {
  return (
    <TouchableOpacity>
        <ChevronLeftIcon size="30" />
    </TouchableOpacity>
  )
}