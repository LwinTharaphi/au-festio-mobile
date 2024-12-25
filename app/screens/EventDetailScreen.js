import React, { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export default function EventDetailScreen({ route }) {
  const { eventId } = route.params;
  const { organizerId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setqrModalVisible] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    faculty: '',
    phone: '',
    paymentScreenshot: null,
  });
  const [isRegistered, setIsRegistered] = useState(false);
  const [studentId, setStudentId] = useState(null); // State to store student ID
  const faculties = ['VMES', 'MSME', 'Arts', 'Music', 'Biotechnology', 'Law', 'Communication Arts', 'Architecture and Design', 'Nursing Science'];

  useEffect(() => {
    // Fetch event details
    fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}`)
      .then((response) => response.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching event details:', error);
        setLoading(false);
      });
  }, [organizerId, eventId]);

  const handleRegister = () => {
    setModalVisible(true);
  };

  const handleReceiptUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setFormData({ ...formData, receipt: result });
      }
    } catch (error) {
      console.error('Error uploading receipt:', error);
    }
  };

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri); // Save the image URI to state
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
  };

  const handleImageClick = () => {
    setqrModalVisible(true);
  };
  const handleImageClose = () => {
    setqrModalVisible(false);
  };

  const handleConfirm = () => {
    Alert.alert(
      "Confirm Registration",
      "Are you sure you want to register for this event?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Registration Cancelled"),
          style: "cancel"
        },
        {
          text: "OK",
          onPress: () => {
            const payload = { ...formData, eventId };

            if (formData.receipt) {
              payload.append('receipt', {
                uri: formData.receipt.uri,
                name: formData.receipt.name || 'receipt.jpg',
                type: 'image/jpeg',
              });
            }
            fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/students`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error('Failed to register');
                }
                return response.json();
              })
              .then((data) => {
                Alert.alert('Success', 'You have successfully registered!');
                setModalVisible(false);
                setFormData({ name: '', email: '', faculty: '', phone: '' });
                setIsRegistered(true);
                setStudentId(data._id); // Use the _id from the response
              })
              .catch((error) => {
                console.error('Error registering:', error);
                Alert.alert('Error', 'An error occurred. Please try again.');
              });
          }
        }
      ]
    );
  };

  const handleCancelRegistration = () => {
    Alert.alert(
      "Cancel Registration",
      "Are you sure you want to cancel your registration?",
      [
        {
          text: "No",
          onPress: () => console.log("Cancellation Cancelled"),
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => {
            fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/students/${studentId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
            })
              // .then((response) => response.json())
              .then((response) => {
                if (response.ok) {
                  Alert.alert('Success', 'Your registration has been cancelled.');
                  setIsRegistered(false);
                  setStudentId(null); // Clear the student ID
                } else {
                  Alert.alert('Error', 'Failed to cancel registration. Please try again.');
                }
              })
              .catch((error) => {
                console.error('Error cancelling registration:', error);
                Alert.alert('Error', 'An error occurred. Please try again.');
              });
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.text}>Failed to load event details.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Event Poster */}
        <Image
          source={{ uri: `https://au-festio.vercel.app/uploads/posters/${event.posterName}` }}
          style={styles.poster}
        />

        {/* Event Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{event.eventName}</Text>
          <Text style={styles.detail}>Location: {event.location}</Text>
          <Text style={styles.detail}>
            Date: {new Date(event.eventDate).toLocaleDateString()}
          </Text>
          <Text style={styles.detail}>
            Registration Deadline: {new Date(event.registerationDate).toLocaleDateString()}
          </Text>
          <Text style={styles.detail}>Start Time: {event.startTime || 'N/A'}</Text>
          <Text style={styles.detail}>End Time: {event.endTime || 'N/A'}</Text>
          <Text style={styles.detail}>Is Paid: {event.isPaid ? 'Yes' : 'No'}</Text>
        </View>

        {/* Register/Cancel Button */}
        <Button
          title={isRegistered ? "Cancel Registration" : "Register"}
          onPress={isRegistered ? handleCancelRegistration : handleRegister}
        />

        {/* Registration Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Register for Event</Text>
              <TextInput
                placeholder="ID"
                style={styles.input}
                value={formData.sid}
                onChangeText={(text) => setFormData({ ...formData, sid: text })}
              />
              <TextInput
                placeholder="Name"
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
              <TextInput
                placeholder="Email"
                style={styles.input}
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
              />
              <View style={[styles.pickerContainer, { height: 43 }]}>
                <Picker
                  selectedValue={formData.faculty}
                  style={[
                    styles.picker,
                    { color: formData.faculty === '' ? '#aaa' : '#000' }, // Conditional text color
                  ]}
                  onValueChange={(value) => setFormData({ ...formData, faculty: value })}
                >
                  <Picker.Item label="Select Faculty" value="" />
                  {faculties.map((faculty) => (
                    <Picker.Item key={faculty} label={faculty} value={faculty} />
                  ))}
                </Picker>
              </View>

              <TextInput
                placeholder="Phone"
                style={styles.input}
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
              />
              {event.isPaid && (
                <>
                  <TouchableOpacity onPress={handleImageClick}>
                    <Image
                      source={{ uri: `https://au-festio.vercel.app/uploads/QR/${event.qrName}` }}
                      style={styles.qrImage}
                    />
                  </TouchableOpacity>
                  {/* <Button title="Upload Payment Receipt" onPress={handleReceiptUpload} />
                  {formData.receipt && <Text>Uploaded: {formData.receipt.name}</Text>} */}

                  {/* <View style={[styles.pickerContainer, { height: 43 }]}>
                    <TouchableOpacity style={styles.picker} onPress={handleReceiptUpload}>
                      {formData.receipt ? (
                        <Text style={styles.uploadedText}>{formData.receipt.fileName || 'Receipt Uploaded'}</Text>
                      ) : (
                        <Text style={styles.placeholder}>Upload Receipt</Text>
                      )}
                      <Icon name="cloud-upload" size={24} color="#4CAF50" style={styles.icon} />
                    </TouchableOpacity>
                    {formData.receipt && (
                      <View style={styles.uploadedContainer}>
                        <Text style={styles.uploadedText}>Uploaded: {formData.receipt.fileName}</Text>
                      </View>
                    )}
                  </View> */}

                  {/* Image Upload Button */}
                  <TouchableOpacity onPress={handleImageUpload}>
                    <Text style={styles.uploadText}>Upload Payment Screenshot</Text>
                  </TouchableOpacity>
                  {uploadedImage && (
                    <View style={styles.uploadedImageContainer}>
                      <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} />
                      <TouchableOpacity onPress={removeImage}>
                        <Text style={styles.removeText}>Remove Image</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Modal for full-screen image */}
                  <Modal
                    visible={qrModalVisible}
                    transparent={true}
                    onRequestClose={handleImageClose}
                  >
                    <TouchableWithoutFeedback onPress={handleImageClose}>
                      <View style={styles.modalContainer}>
                        <Image
                          source={{ uri: `https://au-festio.vercel.app/uploads/QR/${event.qrName}` }}
                          style={styles.fullScreenImage}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>
                </>
              )}

              <View style={styles.buttonContainer}>
                <View style={styles.buttonWrapper}>
                  <Button title="Cancel" onPress={() => setModalVisible(false)} />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button title="Confirm" onPress={handleConfirm} />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poster: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detail: {
    fontSize: 16,
    marginBottom: 5,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: '100%',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    justifyContent: 'center', // Center the picker vertically
    overflow: 'hidden', // Clip anything exceeding the container bounds
    marginBottom: 10,
  },
  picker: {
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 10,
  },
  buttonWrapper: {
    width: 120, // Set the width here as per your requirement
    marginBottom: 10, // Add margin as needed
  },
  qrImage: {
    width: 150,
    height: 150,
    marginVertical: 10,
    alignSelf: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
  uploadText: {
    fontSize: 16,
    color: '#0066cc',
    marginBottom: 15,
  },
  uploadedImageContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },

  uploadedText: {
    fontSize: 16,
    color: '#333',
  },
  icon: {
    marginLeft: 250,
  },
  uploadedContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  uploadedImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  removeText: {
    fontSize: 14,
    color: 'red',
  },
});
