import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { colors } from '../theme';
import { Snackbar } from 'react-native-paper';
import BackButton from '../components/BackButton'

export default function ChangePasswordScreen({ navigation }) {
    const auth = getAuth();
    const user = auth.currentUser;
    console.log('User:', user);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [snackbarVisible, setSnackbarVisible] = React.useState(false);
    const [snackbarMessage, setSnackbarMessage] = React.useState('');
    const [snackbarColor, setSnackbarColor] = React.useState('red');
    
    const showSnackbar = (message, color) => {
        setSnackbarMessage(message);
        setSnackbarColor(color);
        setSnackbarVisible(true);
    }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      setSuccess('');
      showSnackbar('Please fill in all fields.', 'red');
      return;
    }
    if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        setSuccess('');
        showSnackbar('New passwords do not match.', 'red');
        return;
    }

    try {
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update the password
      await updatePassword(user, newPassword);
      setSuccess('Password updated successfully!');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
      showSnackbar('Password updated successfully!', 'green');

      // Optionally, navigate back to the Profile screen
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password. Check your current password.');
      setSuccess('');
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
        <View className="relative">
            <View className="absolute top-5 left-0 z-10">
            <BackButton />
            </View>
            <View className="flex-row justify-center mt-5 my-3">
                <Text className="text-2xl font-bold text-gray-800 mb-4">Change Password</Text>
            </View>
        </View>
        {error ? (
            <Text className="text-red-500 text-sm mb-4">{error}</Text>
        ) : null}

        {success ? (
            <Text className="text-green-500 text-sm mb-4">{success}</Text>
        ) : null}

        <View className="space-y-2 mx-2 mb-5">
            <Text
            className="font-bold text-lg mb-2"
            style={{ color: colors.heading }}
            >
            Current Password
            </Text>
            <TextInput
            className="border border-gray-300 p-4 rounded-lg mb-5"
            placeholder="Current Password"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            />

            <Text
            className="font-bold text-lg mb-2"
            style={{ color: colors.heading }}
            >
            New Password
            </Text>
            <TextInput
            className="border border-gray-300 p-4 rounded-lg mb-5"
            placeholder="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            />

            <Text
            className="font-bold text-lg mb-2"
            style={{ color: colors.heading }}
            >
            Confirm New Password
            </Text>
            <TextInput
            className="border border-gray-300 p-4 rounded-lg mb-5"
            placeholder="Confirm New Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            />
        </View>

        <TouchableOpacity
        className="p-3 rounded-lg"
        style={{ backgroundColor: colors.button }}
        onPress={handleChangePassword}
        >
            <Text className="text-white text-center font-semibold">Update Password</Text>
        </TouchableOpacity>
        <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            style={{ backgroundColor: snackbarColor }}
        >
            {snackbarMessage}
        </Snackbar>
    </View>
  );
}
