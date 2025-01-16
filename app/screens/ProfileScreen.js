import { View, Text , TextInput, Button} from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as Icon from 'react-native-feather'
import { useDispatch, useSelector } from 'react-redux'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import { setUser } from '../redux/slice/user'
import { useNavigation } from '@react-navigation/native'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth';
export default function ProfileScreen({route, navigation}) {
    // const dispatch = useDispatch();
    const [currentUser, setCurrentUser] = React.useState(route.params.user);
    const handleLogout = async() => {
        try{
            await signOut(auth);
            // dispatch(setUser(null));
            console.log('User logged out (ProfileScreen)');
            // navigation.navigate("Welcome")
        } catch (error) {
            console.log('Error logging out:', error)
        }
    }
    // const {user} = useSelector(state => state.user);
    const [name, setName] = React.useState('');

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('User in profile ',user.displayName);
            await user.reload();
            console.log('user in profile reload ',user.displayName);
            setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || '',
                emailVerified: user.emailVerified,
            });
        });
        return () => unsubscribe();
    }, []);

  return (
    <SafeAreaView classname="bg-white">
        {/* <StatusBar barStyle="dark-content" />
        <View classname="flex-row items-center space-x-2 px-4 pb-2">
            <View classname="flex-row flex-1 items-center p-3 rounded-full border border-gray-300">
                <Icon.Search height="25" width="25" stroke="gray" />
                <TextInput placeholder='Search for events' classname="ml-2 flex-1" />
                <View classname="flex-row items-center space-x-1 border-0 border-l-2 pl-2 border-l-gray-300">
                    <Icon.MapPin height="20" width="20" stroke="gray" />
                    <Text classname="text-gray-500">Location</Text>
                </View>
            </View>
            <View classname="p-3 rounded-full">
                <Icon.Filter height="25" width="25" stroke="gray" />
            </View>
        </View> */}
        {/* Show user email or name if logged in */}
        {currentUser? (
            <Text>Welcome, {currentUser.displayName}</Text>
        ) : (
            <Text>No user logged in</Text>
        )}
        <Text>Your email: {currentUser.email}</Text>
        <Button
        title="Logout"
        onPress={handleLogout}
        color="#f44336" // You can customize the button color here
        />
    </SafeAreaView>
  )
}