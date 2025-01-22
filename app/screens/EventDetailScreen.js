import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import QRCode from 'react-native-qrcode-svg';
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
import { auth } from '../config/firebase'
import { SvgXml } from 'react-native-svg';
import { uploadFile, deleteImage } from '../services/aws';
import { AWS_BUCKET_NAME, AWS_REGION } from '@env';

export default function EventDetailScreen({ route }) {
  const navigation = useNavigation();
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
  const [qrData, setQrData] = useState(null);
  const [registeredDate, setRegisteredDate] = useState(null);
  const faculties = ['VMES', 'MSME', 'Arts', 'Music', 'Biotechnology', 'Law', 'Communication Arts', 'Architecture and Design', 'Nursing Science'];
  const user = auth.currentUser;
  const baseS3Url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/`;

  useEffect(() => {
    // Fetch event details
    fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}`)
      .then((response) => response.json())
      .then((data) => {
        setEvent(data);
        console.log("Event details:", data);
        // console.log("Event Uri", `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/posters/${data.poster}`);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching event details:', error);
        setLoading(false);
      });
    const fetchQRCodes = async () => {
      try {
        const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/qr`);
        const data = await response.json();
        console.log('QR Code Data:', data);
        setQrData(data.qrSvg);
      } catch (error) {
        console.error('Error fetching QR code:', error);
      }
    }
    fetchQRCodes();
  }, [organizerId, eventId]);

  const currentDate = new Date().toLocaleDateString();

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
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to the media library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0];
      console.log('Image uploaded:', result.assets[0]);
      setFormData({ ...formData, paymentScreenshot: selectedImage });

      // const fileName = selectedImage.uri.split('/').pop();
      // const imageUrl = await uploadFile(selectedImage, fileName, 'PaymentReceipts');
      // if (imageUrl) {
      //   console.log('Image uploaded successfully:', imageUrl);
      //   setFormData({ ...formData, paymentScreenshot: imageUrl});
      // } else {
      //   Alert.alert('Error', 'Failed to upload image. Please try again.');
      // }
    }
  };

  const removeImage = async () => {
    setFormData({ ...formData, paymentScreenshot: null });
    // if(formData.paymentScreenshot) {
    //   const deleteSuccess = await deleteImage(formData.paymentScreenshot);
    //   if (deleteSuccess) {
    //     setFormData({ ...formData, paymentScreenshot: null });
    //   } else {
    //     Alert.alert('Error', 'Failed to delete image. Please try again.');
    //   }
    // }
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
          onPress: async () => { // Make this function async
            const firebaseUID = user?.uid;
            const payload = { ...formData, eventId, firebaseUID };
            // console.log('Registration data:', payload );
            console.log('Registration Payload:', payload);

            try {
              if(formData.paymentScreenshot) {
                console.log('Uploading image:', formData.paymentScreenshot);
                const selectedImage = formData.paymentScreenshot;
                const fileName = selectedImage.uri.split('/').pop();
                const imageUrl = await uploadFile(selectedImage, fileName, 'PaymentReceipts');
                if (imageUrl) {
                  console.log('Image uploaded successfully:', imageUrl);
                  payload.paymentScreenshot = imageUrl;
                } else {
                  Alert.alert('Error', 'Failed to upload image. Please try again.');
                }
              }

              const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });

              if (!response.ok) {
                console.log('Failed to register:', response.status);
                throw new Error('Failed to register', response.status);
              }
              // Fetch the student's data after successful registration
              const data = await response.json();
              console.log('Registration successful:', response);
              console.log('Student data:', data);

              if (data.createdAt) {
                const registeredDate = new Date(data.createdAt);
                console.log('Student Registration Date:', registeredDate);
                setRegisteredDate(registeredDate);
                // Now you can use registrationDate (createdAt) for further processing
              } else {
                throw new Error('CreatedAt not found in student data');
              }
              console.log('Registration successful:', data);
              // Navigate to RegistrationSuccess screen
              navigation.navigate('RegistrationSuccess', { eventId, organizerId });

              // Automatically navigate to EventDetail after 3 seconds
              const timer = setTimeout(() => {
                navigation.navigate('EventDetail', { eventId, organizerId });
              }, 3000); // 3000 ms = 3 seconds          

              setModalVisible(false);
              setFormData({ name: '', email: '', faculty: '', phone: '' });
              setIsRegistered(true);
              setStudentId(data._id); // Use the _id from the response

              // Generate QR code data
              const qrPayload = `${eventId},${data._id}`;
              setQrData(qrPayload);

              // Create the QR code using the react-native-qrcode-svg component
              const qrCodeData = qrPayload;

              // Send the QR code to the API (localhost:3000)
              fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/students/savecheckinqr`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  studentId: data._id, // Use data._id instead of studentId
                  eventId: eventId, // Make sure you have the eventId
                  qrCodeData: qrCodeData, // Send the QR payload
                }),
              })
                .then((response) => response.json())
                .then((data) => {
                  console.log("QR code saved to the database successfully.", data);
                })
                .catch((error) => {
                  console.error("Error posting QR code:", error);
                });

            } catch (error) {
              console.error('Error registering:', error);
              Alert.alert('Error', 'An error occurred. Please try again.');
            }
          }
        }
      ]
    ); return () => clearTimeout(timer);
  };

  const handleCancelRegistration = () => {
    Alert.alert(
      "Cancel Registration",
      "Are you sure you want to cancel your registration?",
      [
        {
          text: "No",
          onPress: () => console.log("Cancellation Cancelled"),
          style: "cancel",
        },
        {
          text: 'Yes',
          onPress: () => {
            if (!registeredDate) {
              Alert.alert('Error', 'Registration date not available.');
              return;
            }

            const currentDate = new Date();
            const diffInTime = currentDate.getTime() - registeredDate.getTime();
            const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));
            let cancellationMessage = "Your registration has been cancelled.";

            if (event.isPaid) {
              const sortedRefundPolicy = event.refundPolicy.sort((a, b) => a.days - b.days);
              const applicablePolicy = sortedRefundPolicy.find((policy) => diffInDays <= policy.days);

              if (applicablePolicy) {
                console.log("Refund Details:", {
                  refundPercentage: applicablePolicy.percentage,
                  eventId: event._id,
                  studentId: studentId
                });
                navigation.navigate('Refund', {
                  refundPercentage: applicablePolicy.percentage,
                  eventId: event._id,
                  studentId,
                });
                return;
              } else {
                cancellationMessage += " However, you cannot get a refund as the refund period has expired.";
              }
            }

            // Proceed with cancellation if event is not paid or refund period is over
            fetch(
              `https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/students/${studentId}`,
              {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
              }
            )
              .then((response) => {
                if (response.ok) {
                  Alert.alert("Success", cancellationMessage);
                  setIsRegistered(false);
                  setStudentId(null); // Clear the student ID
                } else {
                  Alert.alert("Error", "Failed to cancel registration. Please try again.");
                }
              })
              .catch((error) => {
                console.error("Error cancelling registration:", error);
                Alert.alert("Error", "An error occurred. Please try again.");
              });
          },
        },
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

  if (isRegistered) {
    return (
      <ScrollView>
        <View style={styles.container}>
          {/* Section 1: Event Title */}
          <Text style={styles.title}>You have registered for {event.eventName}</Text>
          <View style={styles.line} />
          <Image
            source={{ uri: `${event.poster}` }}
            style={styles.fullposter}
          />
          <View style={styles.line} />
          {/* Section 3: Date, Time, and QR Code */}
          <View style={[styles.detailRow, { justifyContent: "space-between", alignItems: "center" }]}>
            <View style={styles.eventDetails}>
              <View style={styles.detailRow}>
                <Icon name="place" size={24} color="#555" />
                <Text style={styles.detailText}> {event.location || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="event" size={24} color="#555" />
                <Text style={styles.detailText}>
                  {new Date(event.eventDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="schedule" size={24} color="#555" />
                <Text style={styles.detailText}>Start: {event.startTime || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="schedule" size={24} color="#555" />
                <Text style={styles.detailText}>End: {event.endTime || "N/A"}</Text>
              </View>

            </View>
            <View style={{ marginTop: -25 }}>
              <Text style={styles.detailText}>Your check-in QR:</Text>
              <TouchableOpacity onPress={() => setqrModalVisible(true)} style={styles.qrContainer}>
                <QRCode value={qrData} size={100} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.line} />

          {/* QR Code Modal */}
          <Modal
            visible={qrModalVisible}
            transparent={true}
            onRequestClose={() => setqrModalVisible(false)}
          >
            <TouchableWithoutFeedback onPress={() => setqrModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <QRCode value={qrData} size={300} />
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Register/Cancel Button */}
          <Button
            title={isRegistered ? "Cancel Registration" : "Register"}
            onPress={isRegistered ? handleCancelRegistration : handleRegister}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        {/* Event Poster */}
        <Image
          source={{ uri: `${event.poster}` }}
          style={styles.fullposter}
        />

        {/* Event Details */}
        <View style={styles.detailsContainer}>
          {/* Event Title */}
          <Text style={styles.title}>{event.eventName}</Text>

          <View style={styles.line} />

          {/* Event Location */}
          <Text style={styles.detail}>
            <Icon name="place" size={20} color="#555" /> Location: {event.location || 'N/A'}
          </Text>

          {/* Event Date */}
          <Text style={styles.detail}>
            <Icon name="calendar-today" size={20} color="#555" /> Event Date: {new Date(event.eventDate).toLocaleDateString()}
          </Text>

          {/* Registration Deadline */}
          <Text style={styles.detail}>
            <Icon name="calendar-today" size={20} color="#555" /> Registration Date: {new Date(event.registerationDate).toLocaleDateString()}
          </Text>

          {/* Event Start Time */}
          <Text style={styles.detail}>
            <Icon name="access-time" size={20} color="#555" /> Start Time: {event.startTime || 'N/A'}
          </Text>

          {/* Event End Time */}
          <Text style={styles.detail}>
            <Icon name="access-time" size={20} color="#555" /> End Time: {event.endTime || 'N/A'}
          </Text>

          <Text style={styles.detail}>
            <Icon name="wallet" size={20} color="#555" />
            {event.isPaid ? `Fees: ${event.price || 'N/A'} TBH` : 'It is a free event'}
          </Text>


          <Text style={styles.policyText}>
            You get {event.discount}% early bird discount if you register on {new Date(event.registerationDate).toLocaleDateString()}.
          </Text>

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
          <ScrollView contentContainerStyle={{ flexGrow: 0.5, paddingTop: 20 }}>
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
                      <SvgXml xml={qrData} width="200" height="200" />
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
                    {formData.paymentScreenshot && (
                      <View style={styles.uploadedImageContainer}>
                        <Image source={{ uri: formData.paymentScreenshot.uri }} style={styles.uploadedImage} />
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
                        <SvgXml xml={qrData} width="100%" height="100%" />
                        </View>
                      </TouchableWithoutFeedback>
                    </Modal>
                  </>
                )}
                <View>
                  <Text style={styles.policyText}>By registering, you agree to the terms and conditions of the event.</Text>
                  <Text style={styles.policyText}>
                    Refund Policy:
                    {event.refundPolicy && event.refundPolicy.length > 0 ? (
                      event.refundPolicy.map((policy, index) => {
                        let policyText = ` ${policy.percentage}% in ${policy.days} days`;
                        // Add comma except for the last policy
                        if (index < event.refundPolicy.length - 1) {
                          policyText += ', ';
                        }
                        return policyText;
                      })
                    ) : (
                      " No Refund Policy"
                    )}
                    {event.refundPolicy && event.refundPolicy.length > 0 && (
                      ` and no refund after ${event.refundPolicy[event.refundPolicy.length - 1].days} days.`
                    )}
                  </Text>
                </View>
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
          </ScrollView>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
    paddingBottom: 150,
    paddingLeft: 20,
    paddingRight: 20,
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
  fullposter: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
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
  line: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  poster: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 20,
  },
  studentInfo: {
    flex: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  qrContainer: {
    alignSelf: "flex-end",
    marginTop: 10,
  },
  policyText: {
    fontSize: 10, // small font size
    color: 'red', // red color
    marginTop: 5, // optional, adds some spacing above the text
    marginBottom: 7, // optional, adds some spacing
  },
});
