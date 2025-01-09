import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'react-native'
import "../../global.css"
import { colors } from '../theme'
import { useNavigation } from 'expo-router'
import BackButton from '../components/BackButton'
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler'

export default function SignInScreen() {
  const navigation = useNavigation()
  return (
    <GestureHandlerRootView>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex justify-between h-full mx-4">
          {/* Top Section */}
          <View>
            {/* Back Button */}
            <View className="relative">
              <View className="absolute top-0 left-0 z-10">
                <BackButton />
              </View>
            </View>

            {/* Welcome Text */}
            <View className="space-y-2 mx-2 mb-5 mt-5">
              <Text
                className="font-bold text-2xl"
                style={{ color: colors.heading }}
              >
                Sign Up
              </Text>
            </View>

            {/* Form Fields */}
            <View className="space-y-2 mx-2 mb-5">
              <View className="mb-5">
                <Text
                  className="font-bold text-lg mb-2"
                  style={{ color: colors.heading }}
                >
                  Full Name
                </Text>
                <TextInput
                  placeholder="Enter your name"
                  className="p-4 bg-gray-100 rounded-lg"
                />
              </View>
              <View className="mb-5">
                <Text
                  className="font-bold text-lg mb-2"
                  style={{ color: colors.heading }}
                >
                  Email
                </Text>
                <TextInput
                  placeholder="Enter your email"
                  className="p-4 bg-gray-100 rounded-lg"
                />
              </View>
              <View className="mb-5">
                <Text
                  className="font-bold text-lg mb-2"
                  style={{ color: colors.heading }}
                >
                  Password
                </Text>
                <TextInput
                  placeholder="Enter your password"
                  secureTextEntry
                  className="p-4 bg-gray-100 rounded-lg"
                />
              </View>
              <View className="mb-5">
                <Text
                  className="font-bold text-lg mb-2"
                  style={{ color: colors.heading }}
                >
                  Confirm Password
                </Text>
                <TextInput
                  placeholder="Enter your password again"
                  className="p-4 bg-gray-100 rounded-lg"
                />
              </View>
            </View>
            <View>
              {/* Sign In Button */}
              <TouchableOpacity
                className="py-3 rounded-lg mb-4"
                style={{ backgroundColor: colors.button }}
              >
                <Text className="text-center text-lg font-bold text-white">
                  Sign Up
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-2 mt-1 mb-5">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="text-center mx-2">Or</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Sign In with Google */}
              <TouchableOpacity
                className="py-3 rounded-lg"
                style={{ backgroundColor: colors.button }}
              >
                <Text className="text-center text-lg font-bold text-white">
                  Sign In with Google
                </Text>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View className="flex-row justify-center mt-4">
                <Text className="text-base">
                  Already have a account?{' '}
                  <Text className="font-bold text-blue-500" onPress={()=>navigation.navigate("SignIn")}>Sign In</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}