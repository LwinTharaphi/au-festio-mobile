import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image, Alert } from 'react-native'
import "../../global.css"
import { colors } from '../theme'
import BackButton from '../components/BackButton'
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler'
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword , onAuthStateChanged,sendPasswordResetEmail} from 'firebase/auth'
import { auth } from '../config/firebase'
import { Snackbar } from 'react-native-paper'
import { useDispatch, useSelector } from 'react-redux'
import Loading from '../components/loading'
import { setUserLoading, setUser } from '../redux/slice/user'
import { useAuthRequest } from 'expo-auth-session'
import { useNavigation } from '@react-navigation/native'

export default function SignInScreen() {
  const navigation = useNavigation()
  // const dispatch = useDispatch()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarColor, setSnackbarColor] = React.useState('red');
  // const {user, userLoading} = useSelector((state) => state.user)

  // React.useEffect(() => {
  //   GoogleOneTapSignIn.init({ 
  //     webClientId: process.env.webClientId, 
  //   });
  // }, []);
  const showSnackbar = (message, color) => {
    setSnackbarMessage(message);
    setSnackbarColor(color);
    setSnackbarVisible(true);
  }
  

  const handleSubmit = async() => {
    try {
      if (email && password) {
        // dispatch(setUserLoading(true))
        const userData = await signInWithEmailAndPassword(auth, email, password);
        // dispatch(setUser({
        //   uid: userData.user.uid,
        //   email: userData.user.email,
        //   displayName: userData.user.displayName,
        // }));
        // dispatch(setUserLoading(false));
        console.log('Sign In Successful');
        showSnackbar('Sign In Successful', 'green');
      } else {
        showSnackbar('Please fill all the fields', 'red');
      }
    } catch (error) {
      // dispatch(setUserLoading(false));
      console.error(error.message);
      showSnackbar(error.message, 'red');
    }
  }
  
  // Somewhere in your code
  // const signIn = async () => {
  //   try {
  //     await GoogleOneTapSignIn.checkPlayServices();
  //     const response = await GoogleOneTapSignIn.signIn();
  
  //     if (isSuccessResponse(response)) {
  //       // read user's info
  //       console.log(response.data);
  //       const { idToken } = response.data;
  //       const googleCredential = GoogleAuthProvider.credential(idToken);
  //       await signInWithCredential(auth, googleCredential);
  //       console.log('Sign In with Google Successful');
  //       navigation.navigate('Home');
  //     } else if (isNoSavedCredentialFoundResponse(response)) {
  //       // Android and Apple only.
  //       // No saved credential found (user has not signed in yet, or they revoked access)
  //       // call `createAccount()`
  //       console.log('No saved credential found');
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     if (isErrorWithCode(error)) {
  //       switch (error.code) {
  //         case statusCodes.ONE_TAP_START_FAILED:
  //           // Android-only, you probably have hit rate limiting.
  //           // You can still call `presentExplicitSignIn` in this case.
  //           console.log('One tap start failed');
  //           break;
  //         case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
  //           // Android: play services not available or outdated.
  //           // Get more details from `error.userInfo`.
  //           // Web: when calling an unimplemented api (requestAuthorization)
  //           // or when the Google Client Library is not loaded yet.
  //           console.log('Play services not available');
  //           break;
  //         default:
  //           console.log('Something else happened');
  //           break;
  //         // something else happened
  //       }
  //     } else {
  //       // an error that's not related to google sign in occurred
  //       console.error('Something else happened');
  //     }
  //   }
  // };
  const handleResetPassword = async () => {
      if (!email) {
        Alert.alert('Error', 'Please enter your email to reset the password.');
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        Alert.alert(
          'Password Reset Email Sent',
          `A password reset email has been sent to ${email}. Please check your inbox.`,
        );
      } catch (error) {
        console.error('Error sending password reset email:', error);
        Alert.alert('Error', error.message || 'Failed to send password reset email.');
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
              <View className="absolute top-5 left-0 z-10">
                <BackButton />
              </View>
            </View>

            {/* Logo */}
            <View className="flex-row justify-center mt-5 my-3">
              <Image
                source={require('../../assets/images/image 80.png')}
                className="h-70 w-80"
                resizeMode='contain'
              />
            </View>

            {/* Welcome Text */}
            <View className="space-y-2 mx-2 mb-5 mt-5">
              <Text
                className="text-center font-bold text-2xl"
                style={{ color: colors.heading }}
              >
                Welcome Back!
              </Text>
              <Text
                className="text-center text-base mt-2"
                style={{ color: colors.subHeading }}
              >
                Use your credentials to access your account
              </Text>
            </View>

            {/* Form Fields */}
            <View className="space-y-2 mx-2 mb-5">
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
                  value={email} onChangeText={value => setEmail(value)}
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
                  value={password} onChangeText={value => setPassword(value)}
                />
              </View>
            </View>
            <View className="flex-row justify-end mb-5">
              <TouchableOpacity onPress={handleResetPassword}>
              <Text className="text-base text-blue-500">Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View>
              <TouchableOpacity className="py-3 rounded-lg mb-4" style={{ backgroundColor: colors.button }} onPress={handleSubmit}>
                <Text className="text-center text-lg font-bold text-white">
                  Sign In
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
                  Don't have an account?{' '}
                  <Text className="font-bold text-blue-500" onPress={()=>navigation.navigate('SignUp')}>Sign Up</Text>
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