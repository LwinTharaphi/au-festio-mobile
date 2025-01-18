import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase'; // Your Firebase configuration
import { updatePassword, onAuthStateChanged } from 'firebase/auth';
import { colors } from '../theme';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
    const navigation = useNavigation();
    const [user, setUser] = useState(null);

    // Fetch the current user from Firebase Auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
        await auth.signOut();
        console.log('User logged out');
        } catch (error) {
        Alert.alert('Error', 'Failed to log out. Please try again.');
        console.error('Failed to log out:', error);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
        <ScrollView className="mx-4">
            <Text className="text-2xl font-bold text-center my-5" style={{ color: colors.heading }}>
            Profile
            </Text>

            {/* Display User Info */}
            <View className="space-y-4">
            <View>
                <Text className="text-lg font-bold mb-2" style={{ color: colors.subHeading }}>
                Name
                </Text>
                <Text className="text-base p-4 bg-gray-100 rounded-lg">
                {user?.displayName || 'N/A'}
                </Text>
            </View>

            <View>
                <Text className="text-lg font-bold mb-2" style={{ color: colors.subHeading }}>
                Email
                </Text>
                <Text className="text-base p-4 bg-gray-100 rounded-lg">
                {user?.email || 'N/A'}
                </Text>
            </View>

            <View>
                <Text className="text-lg font-bold mb-2" style={{ color: colors.subHeading }}>
                Password
                </Text>
                <Text className="text-base p-4 bg-gray-100 rounded-lg">
                ********
                </Text>
            </View>
            </View>

            {/* Update Password */}
            <View className="mt-8 space-y-4">
            <TouchableOpacity
                className="py-3 rounded-lg"
                style={{ backgroundColor: colors.button }}
                onPress={()=>{
                navigation.navigate('ChangePassword');
                }}
            >
                <Text className="text-center text-lg font-bold text-white">
                    Change Password
                </Text>
            </TouchableOpacity>
            </View>
            <View className="mt-8 space-y-4">
            <TouchableOpacity
                className="py-3 rounded-lg"
                style={{ backgroundColor: colors.button }}
                onPress={handleLogout}
            >
                <Text className="text-center text-lg font-bold text-white">
                    LogOut
                </Text>
            </TouchableOpacity>
            </View>
        </ScrollView>
        </SafeAreaView>
    );
}
