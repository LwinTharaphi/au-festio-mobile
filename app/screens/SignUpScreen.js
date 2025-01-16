import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import "../../global.css"
import { colors } from '../theme'
import { useNavigation } from '@react-navigation/native'
import BackButton from '../components/BackButton'
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler'
import { Snackbar } from 'react-native-paper'
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth'
import { auth, db } from '../config/firebase'
import { useDispatch, useSelector } from 'react-redux'
import { setUser, setUserLoading } from '../redux/slice/user'
import { Loading } from '../components/loading'
import { setDoc, doc } from 'firebase/firestore'

export default function SignUpScreen() {
  const navigation = useNavigation();
  // const dispatch = useDispatch();

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [name, setName] = React.useState('')
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarColor, setSnackbarColor] = React.useState('red');
  const [isAccountCreated, setIsAccountCreated] = React.useState(false); // Track if account is created
  // const { userLoading, user } = useSelector(state => state.user)

  const showSnackbar = (message, color) => {
    setSnackbarMessage(message);
    setSnackbarColor(color);
    setSnackbarVisible(true);
  }

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showSnackbar('Please fill all the fields', 'red');
      return;
    }
  
    if (password !== confirmPassword) {
      showSnackbar('Passwords do not match', 'red');
      return;
    }

    // dispatch(setUserLoading(true));
    try {

      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
      // Update the user's profile with the displayName
      await updateProfile(userCredential.user, { displayName: name });
      // await sendEmailVerification(user);
      await userCredential.user.reload(); // Ensure profile update is reflected
      console.log('User displayName:', userCredential.user.displayName);

      // dispatch(setUser({
      //   uid: userCredential.user.uid,
      //   email: userCredential.user.email,
      //   displayName: userCredential.user.displayName,
      //   emailVerified: userCredential.user.emailVerified,
      // }));
  
      showSnackbar('Account created successfully', 'green');
      setIsAccountCreated(true);
    } catch (error) {
      console.error(error.message);
      // dispatch(setUserLoading(false));
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        showSnackbar('Email is already in use. Please try another email.', 'red');
      } else if (error.code === 'auth/weak-password') {
        showSnackbar('Password is too weak. Please choose a stronger password.', 'red');
      } else if (error.code === 'auth/invalid-email') {
        showSnackbar('Please enter a valid email address.', 'red');
      } else {
        showSnackbar('An unexpected error occurred. Please try again later.', 'red');
      }
    } finally {
      // dispatch(setUserLoading(false));
    }
  };
  

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
            <View className="space-y-2 mx-2 mb-5 mt-10">
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
                  value={name} onChangeText={setName}
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
                  value={email} onChangeText={setEmail}
                  keyboardType="email-address"
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
                  value={password} onChangeText={setPassword}
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
                  secureTextEntry
                  className="p-4 bg-gray-100 rounded-lg"
                  value={confirmPassword} onChangeText={value => setConfirmPassword(value)}
                />
              </View>
            </View>
            <View>
              <TouchableOpacity
                disabled={!name || !email || !password || !confirmPassword}
                className="py-3 rounded-lg mb-4"
                style={{ backgroundColor: colors.button }}
                onPress={handleSubmit}
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
                  <Text className="font-bold text-blue-500" onPress={() => navigation.navigate("SignIn")}>Sign In</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={{ backgroundColor: snackbarColor }}
        >
          {snackbarMessage}
        </Snackbar>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}