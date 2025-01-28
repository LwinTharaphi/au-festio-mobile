import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import the icon library
import { uploadFile, deleteImage } from '../services/aws';
import { AWS_BUCKET_NAME, AWS_REGION } from '@env';

const RefundScreen = ({ route }) => {
  const { refundPercentage, studentId, organizerId, eventId } = route.params;
  const navigation = useNavigation();

  const [qrImage, setQrImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to pick an image
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'You need to allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Updated to use ImagePicker.MediaType
      allowsEditing: false,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setQrImage(result.assets[0]); // Use `result.assets[0].uri` to get the image URI
      console.log("Refund qr",result.assets[0])
    } else {
      Alert.alert('Cancelled', 'No image was selected.');
    }
  };

  const removeImage = () => {
    setQrImage(null);
  }

  /// Function to handle submission
const handleSubmit = async () => {
  if (!qrImage) {
    Alert.alert('Error', 'Please upload your QR code.');
    return;
  }

  setIsSubmitting(true);

  try {
    let imageUrl = null;
    if (qrImage) {
      console.log('Uploading image:', qrImage);
      const selectedImage = qrImage;
      const fileName = selectedImage.uri.split('/').pop();
      imageUrl = await uploadFile(selectedImage, fileName, 'RefundReceipts');
      if (imageUrl) {
        console.log('Image uploaded successfully:', imageUrl);
      } else {
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      }
    }
    //update the student record with refund status
    const responseUpdateStudent = await fetch(
      `https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/students/${studentId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refundStatus: 'requested', refundQRCode: imageUrl }),
      }
    );
    const result = await responseUpdateStudent.json();

      if (responseUpdateStudent.ok) {
        Alert.alert('Success', 'Your QR code has been uploaded and refund status updated.',[
        {
          text: 'OK',
          onPress: () => {
            // Navigate to the detail page after the alert is dismissed
            navigation.navigate('MainTabs'); // Replace 'DetailPage' with the actual name of your detail page
          },
        },
      ]);
      } else {
        Alert.alert('Error', result.message || 'Something went wrong.');
      }

    // create a new refund record
    const responseCreateRefund = await fetch(
      `https://au-festio.vercel.app/api/${studentId}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          refundPercentage,
        }),
      }
    );

    const resultCreateRefund = await responseCreateRefund.json();

    if (!responseCreateRefund.ok) {
      throw new Error(resultCreateRefund.message || 'Failed to create refund record');
    }

  } catch (error) {
    Alert.alert('Error', error.message || 'Failed to submit. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <View style={styles.container}>
    <Text style={styles.text}>You are eligible for a {refundPercentage}% refund.</Text>
    <View style={styles.uploadContainer}>
      {/* Upload icon */}
      <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
        <Icon name="cloud-upload" size={40} color="#4CAF50" />
        <Text style={styles.uploadText}>Upload QR Code</Text>
      </TouchableOpacity>

      {qrImage ? (
          <View>
            <Image source={{ uri: qrImage.uri }} style={styles.imagePreview} />
            {/* Remove Image button */}
            <TouchableOpacity onPress={removeImage} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Remove Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.errorText}>No image uploaded</Text>
        )}
    </View>

    <TouchableOpacity
      style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
      onPress={handleSubmit}
      disabled={isSubmitting}
    >
      <Text style={styles.submitButtonText}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Text>
    </TouchableOpacity>
  </View>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  padding: 20,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F3EFFD',
},
text: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#343a40',
  marginBottom: 20,
},
uploadContainer: {
  marginBottom: 20,
  alignItems: 'center',
},
uploadButton: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 10,
  backgroundColor: '#f0f0f0',
  borderRadius: 10,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#ccc',
},
uploadText: {
  marginLeft: 10,
  fontSize: 16,
  color: '#4CAF50',
},
imagePreview: {
  width: 200,
  height: 200,
  marginTop: 10,
  borderRadius: 10,
},
removeButton: {
  marginTop: 10,
  backgroundColor: '#f44336',
  paddingVertical: 8,
  paddingHorizontal: 15,
  borderRadius: 5,
},
removeButtonText: {
  color: '#fff',
  fontWeight: 'bold',
},
errorText: {
  marginTop: 10,
  color: 'red',
},
submitButton: {
  backgroundColor: '#A67EEC',
  paddingVertical: 12,
  paddingHorizontal: 30,
  borderRadius: 8,
  marginTop: 20,
},
submitButtonDisabled: {
  backgroundColor: '#9e9e9e',
},
submitButtonText: {
  fontSize: 18,
  color: 'white',
  fontWeight: 'bold',
},
});

export default RefundScreen;