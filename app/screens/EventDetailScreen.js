import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import RNPickerSelect from 'react-native-picker-select';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import CustomToast from '../components/CustomToast';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebase'
import Svg, { SvgXml } from 'react-native-svg';
import { uploadFile, deleteImage } from '../services/aws';
import { AWS_BUCKET_NAME, AWS_REGION } from '@env';
import { Save } from 'react-native-feather';
import Toast from 'react-native-toast-message';

export default function EventDetailScreen({ route }) {
  const navigation = useNavigation();
  const { expoPushToken } = route.params;
  const { eventId } = route.params;
  const { organizerId } = route.params;
  const { isRegistered: initialIsRegistered } = route.params;
  const { onRegister } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setqrModalVisible] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const formContainer = useRef(new Animated.Value(0)).current;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    faculty: '',
    phone: '',
    paymentScreenshot: null,
  });
  const [isRegistered, setIsRegistered] = useState(initialIsRegistered);
  const [studentId, setStudentId] = useState(null); // State to store student ID
  const [qrData, setQrData] = useState(null);
  const [paymentQR, setPaymentQR] = useState(null);
  const [qrType, setQrType] = useState('');
  const [registeredDate, setRegisteredDate] = useState(null);
  const [status, setStatus] = useState(null);
  const [refundStatus, setRefundStatus] = useState(null);
  const [totalRegistered, setTotalRegistered] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [amount, setAmount] = useState(null);
  // const faculties = ['VMES', 'MSME', 'Arts', 'Music', 'Biotechnology', 'Law', 'Communication Arts', 'Architecture and Design', 'Nursing Science'];
  const faculties = [
    { label: 'VMES', value: 'VMES' },
    { label: 'MSME', value: 'MSME' },
    { label: 'Arts', value: 'Arts' },
    { label: 'Music', value: 'Music' },
    { label: 'Biotechnology', value: 'Biotechnology' },
    { label: 'Law', value: 'Law' },
    { label: 'Communication Arts', value: 'Communication Arts' },
    { label: 'Architecture and Design', value: 'Architecture and Design' },
    { label: 'Nursing Science', value: 'Nursing Science' },
  ];
  const user = auth.currentUser;
  const baseS3Url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/`;

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}`);
        const data = await response.json();
        setEvent(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching event details:", error);
        setLoading(false);
      }
    };

    const fetchQRCodes = async () => {
      try {
        const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/qr`);
        const data = await response.json();
        setPaymentQR(`${data.qrSvg}`);
        setAmount(data.amount);
        console.log("Payment QR code data:", data.qrSvg);
        console.log("Amount:", data.amount);
      } catch (error) {
        console.error("Error fetching QR code:", error);
      }
    };

    const fetchStudentDetails = async () => {
      if (!isRegistered || !user?.uid) return;
      try {
        const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/students`);
        const data = await response.json();

        // Sort by createdAt date to get the latest registration
        const sortedData = data
          .filter((student) => student.firebaseUID === user.uid) // Filter by user ID
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by latest first

        // If there is any student data, set the latest one
        if (sortedData.length > 0) {
          const latestStudent = sortedData[0]; // Get the latest registration
          setStudentId(latestStudent._id);
          setRegisteredDate(new Date(latestStudent.createdAt));
          setStatus(latestStudent.status);
          setRefundStatus(latestStudent.refundStatus);
          // Fetch check-in QR code only if student exists
          // await fetchCheckInQR(latestStudent._id, user.uid);
          // console.log("Check in QR code data:", qrData);
        }
      } catch (error) {
        console.error("Error fetching student details:", error);
      }
    };

    const fetchTotalRegistered = async () => {
      const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/dashboards`);
      const data = await response.json();
      const totalRegistrations = data.stats.totalRegistrations;
      setTotalRegistered(totalRegistrations);
    };

    // Fetch all the data
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch event details and QR codes in parallel
        await Promise.all([fetchEventDetails(), fetchQRCodes(), fetchStudentDetails(), fetchTotalRegistered()]);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizerId, eventId, user, isRegistered]);

  useEffect(() => {
    const fetchCheckInQR = async () => {
      if (!studentId || !user.uid) return;
      try {
        const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/students/getcheckinqr?studentId=${studentId}&firebaseUID=${user.uid}`);
        const data = await response.json();
        console.log("Check in QR code data:", data);
        if (data && data.qrCodeData) {
          setQrData(data.qrCodeData);
          console.log("Check in QR code data:", data.qrCodeData);
        } else {
          // console.error("QR code data not found.");
        }
      } catch (error) {
        console.error("Error fetching check-in QR code:", error);
      }
    };
    fetchCheckInQR();
  }, [studentId, user.uid]);

  useEffect(() => {
    const firebaseUID = user?.uid;
    const getData = async () => {
      try {
        const storedFormData = await AsyncStorage.getItem(`formData_${firebaseUID}`);
        if (storedFormData) {
          setFormData(JSON.parse(storedFormData));
        }
      } catch (error) {
        console.error('Error retrieving data from AsyncStorage:', error);
      }
    };

    getData();
  }, []);

  const saveImageToGallery = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission Denied", "You need to grant permission to save images.");
      return;
    }

    try {
      // Replace base64 data if it's a base64 image
      const base64Code = paymentQR.replace(/^data:image\/\w+;base64,/, "");

      const fileUri = FileSystem.documentDirectory + "paymentQR.jpg";

      await FileSystem.writeAsStringAsync(fileUri, base64Code, { encoding: FileSystem.EncodingType.Base64 });
      await MediaLibrary.saveToLibraryAsync(fileUri);

      // Show success toast
      showToast('Image saved to your gallery!', 'success');
    } catch (error) {
      console.error("Error saving image:", error);

      // Show error toast
      showToast('Failed to save image.', 'error');
    }
  };

  const showToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000); // Hide after 2 seconds
  };

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
    }
  };

  const openQrModal = (type) => {
    setQrType(type);
    setqrModalVisible(true);
  };

  const removeImage = async () => {
    setFormData({ ...formData, paymentScreenshot: null });
  };

  const handleImageClick = () => {
    setqrModalVisible(true);
  };
  const handleImageClose = () => {
    setqrModalVisible(false);
  };
  const requiredFields = ["sid", "name", "email", "faculty", "phone"];
  const missingFields = requiredFields.filter((field) => !formData[field]);

  const shakeForm = () => {
    Animated.sequence([
      // Horizontal shake to the right
      Animated.timing(formContainer, {
        toValue: 10, // Move to the right
        duration: 100,
        useNativeDriver: false, // Use JS thread
      }),
      // Vertical buzz down
      Animated.timing(formContainer, {
        toValue: 10, // Move down
        duration: 100,
        useNativeDriver: false, // Use JS thread
      }),
      // Horizontal shake to the left
      Animated.timing(formContainer, {
        toValue: -10, // Move to the left
        duration: 100,
        useNativeDriver: false, // Use JS thread
      }),
      // Vertical buzz up
      Animated.timing(formContainer, {
        toValue: -10, // Move up
        duration: 50,
        useNativeDriver: false, // Use JS thread
      }),
      // Horizontal shake to the right again
      Animated.timing(formContainer, {
        toValue: 10, // Move to the right
        duration: 50,
        useNativeDriver: false, // Use JS thread
      }),
      // Vertical buzz down again
      Animated.timing(formContainer, {
        toValue: 10, // Move down
        duration: 50,
        useNativeDriver: false, // Use JS thread
      }),
      // Horizontal shake to the left again
      Animated.timing(formContainer, {
        toValue: -10, // Move to the left
        duration: 50,
        useNativeDriver: false, // Use JS thread
      }),
      // Vertical buzz up again
      Animated.timing(formContainer, {
        toValue: -10, // Move up
        duration: 50,
        useNativeDriver: false, // Use JS thread
      }),
      // Return to the original position
      Animated.timing(formContainer, {
        toValue: 0, // Return to the original position
        duration: 50,
        useNativeDriver: false, // Use JS thread
      }),
    ]).start();
  };

  const handleConfirm = () => {

    // Check specifically for the payment receipt in paid events
    if (event.isPaid && !formData.paymentScreenshot) {
      if (missingFields.length === 0) {
        // If only the payment receipt is missing
        setErrorMessage("Please upload your payment receipt.");
        shakeForm();
        return;
      } else {
        // If both the payment receipt and other fields are missing
        missingFields.push("paymentScreenshot");
      }
    }

    if (missingFields.length > 0) {
      // Generic error for missing fields
      setErrorMessage("Please fill all the fields.");
      shakeForm();
      return;
    }

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
            await AsyncStorage.setItem(`formData_${firebaseUID}`, JSON.stringify(formData));
            const payload = { ...formData, eventId, firebaseUID, expoPushToken,amount };
            // console.log('Registration data:', payload );
            console.log('Registration Payload:', payload);

            try {
              if (formData.paymentScreenshot) {
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
                  firebaseUID: data.firebaseUID, // Send the firebaseUID
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

              onRegister && onRegister(); // Call the onRegister function to update the parent component

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

            if (event.isPaid && event.refundPolicy && event.refundPolicy.length > 0) {
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
          <View style={{ flexDirection: 'row', alignItems: 'left', padding: 5 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 5 }}>
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              You have registered for {event.eventName}
            </Text>
          </View>
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
            <View>
              <Text style={styles.detailText}>Your check-in QR:</Text>
              {refundStatus === "requested" ? (
                <View style={styles.pendingContainer}>
                  <Text style={styles.pendingText}>Check-in QR not available anymore</Text>
                </View>
              ) : !event.isPaid || status === "paid" ? (
                <TouchableOpacity onPress={() => openQrModal('checkin')} style={styles.qrContainer}>
                  {qrData ? <QRCode value={qrData} size={100} /> : <Text>No QR code available</Text>}
                </TouchableOpacity>
              ) : (
                <View style={styles.pendingContainer}>
                  <Text style={styles.pendingText}>
                    Your check-in QR will be shown here once the organizer has approved your payment.
                  </Text>
                </View>
              )}
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
                {qrType === 'checkin' ? (
                  <QRCode value={qrData} size={300} />
                ) : (
                  // <QRCode value={paymentQR} size={300} />
                  // <SvgXml xml={paymentQR} width="100%" height="100%" />
                  <Image source={{ uri: paymentQR }} style={{ width: 200, height: 200 }} />
                )}
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Register/Cancel Button */}
          <Button
            title={
              refundStatus === "requested"
                ? "Refund Pending"
                : isRegistered
                  ? "Cancel Registration"
                  : "Register"
            }
            onPress={
              refundStatus === "requested"
                ? null // Disable button action if refund is pending
                : isRegistered
                  ? handleCancelRegistration
                  : handleRegister
            }
            disabled={refundStatus === "requested"} // Optionally disable button
          />
        </View>
      </ScrollView>
    );
  }
  const today = new Date();
  const eventDate = new Date(event.createdAt);
  const isRegistrationClosed = new Date() > new Date(event.registerationDate);
  const isSeatsFull = totalRegistered >= event.seats; // Check if seats are full

  // Calculate the time difference in hours
  const timeDifference = (today - eventDate) / (1000 * 60 * 60);
  return (
    <ScrollView>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 5 }}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        {/* Event Poster */}
        <Image
          source={{ uri: `${event.poster}` }}
          style={styles.fullposter}
        />

        {/* Event Details */}
        <View style={styles.detailsContainer}>
          {/* Event Title */}
          <Text style={styles.title}>
            {event.eventName}
            {(isSeatsFull || isRegistrationClosed) && (
              <Text style={styles.conditionText}>
                {" ("}
                {isSeatsFull && "Seats are full"}
                {isSeatsFull && isRegistrationClosed && " | "}
                {isRegistrationClosed && "Registration Period is over"}
                {")"}
              </Text>
            )}
          </Text>


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
            <Icon name="calendar-today" size={20} color="#555" /> Registration Deadline: {new Date(event.registerationDate).toLocaleDateString()}
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
            {event.isPaid ? `Fees: ${event.price || 'N/A'} THB` : 'It is a free event'}
          </Text>

          {event.isPaid && event.discount ? (
            timeDifference < 24 ? (
              <Text style={styles.policyText}>
                You get {event.discount}% early bird discount if you register today!!
              </Text>
            ) : (
              <Text style={styles.policyText}>The early bird discount period has expired.</Text>
            )
          ) : event.isPaid ? (
            <Text style={styles.policyText}>No discount applied for this event.</Text>
          ) : null}
        </View>

        {/* Register/Cancel Button */}
        <Button
          title={isRegistered ? "Cancel Registration" : "Register"}
          onPress={isRegistered ? handleCancelRegistration : handleRegister}
          disabled={
            (!isRegistered && isRegistrationClosed) || isSeatsFull // Disable if registration is closed or seats are full
          }
        />
        {/* Registration Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {errorMessage ? (
                  <Text style={[styles.errorMessage, { color: "red" }]}>
                    {errorMessage}
                  </Text>
                ) : null}
                <Text style={styles.modalTitle}>Register for {event.eventName}</Text>
                <Animated.View
                  style={{
                    transform: [{ translateX: formContainer }], // Apply the shake animation to the form container
                  }}
                >

                  <TextInput
                    placeholder="ID"
                    placeholderTextColor="#AAA"
                    style={styles.input}
                    value={formData.sid}
                    onChangeText={(text) => setFormData({ ...formData, sid: text })}
                  />
                  <TextInput
                    placeholder="Name"
                    placeholderTextColor="#AAA"
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor="#AAA"
                    style={styles.input}
                    keyboardType="email-address"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                  />
                  <View style={[styles.pickerContainer, { height: 43 }]}>

                    <RNPickerSelect
                      onValueChange={(value) => setFormData({ ...formData, faculty: value })}
                      items={faculties}
                      placeholder={{ label: 'Select Faculty', value: '' }}
                      style={{
                        inputIOS: {
                          ...styles.picker,
                          color: formData.faculty ? "#000" : "#AAA",
                        },
                        inputAndroid: {
                          ...styles.picker,
                          color: formData.faculty ? "#000" : "#AAA",
                        },
                        placeholder: {
                          color: "#AAA", // Same logic for Android
                        },
                        viewContainer: {
                          borderWidth: 1,
                          borderColor: '#ccc',
                          borderRadius: 5,
                          justifyContent: 'center',
                        },
                        iconContainer: {
                          top: '50%', // Vertically center the icon
                          transform: [{ translateY: -12 }], // Adjust based on icon size
                        },
                      }}
                      value={formData.faculty}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => <Icon name="arrow-drop-down" size={24} color="#AAA" />}
                    />
                  </View>

                  <TextInput
                    placeholder="Phone"
                    placeholderTextColor="#AAA"
                    style={styles.input}
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  />
                  {event.isPaid && (
                    <>
                      <TouchableOpacity
                        onPress={saveImageToGallery}
                        style={{ justifyContent: 'center', alignItems: 'center' }}
                      >
                        {/* <SvgXml xml={paymentQR} width="180" height="180" /> */}
                        <Image source={{ uri: paymentQR }} style={{ width: 180, height: 180 }} />
                        {/* <QRCode value={paymentQR} size={300} /> */}
                        <CustomToast
                          message={toastMessage}
                          type={toastType}
                          visible={toastVisible}
                        />
                      </TouchableOpacity>

                      {/* Image Upload Button */}
                      <TouchableOpacity
                        onPress={handleImageUpload}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 3,
                          justifyContent: 'center',
                          backgroundColor: '#E8F5E9',
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: '#4CAF50',
                          marginVertical: 5,
                        }}
                      >
                        <Icon name="cloud-upload" size={35} color="#4CAF50" />
                        <Text
                          style={{
                            marginLeft: 10,
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: '#4CAF50',
                          }}
                        >
                          Upload Payment Screenshot
                        </Text>
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
                            {/* <SvgXml xml={paymentQR} width="100%" height="100%" /> */}
                            <Image source={{ uri: paymentQR }} style={{ width: 400, height: 400 }} />
                            {/* <QRCode value={paymentQR} size={300} /> */}
                          </View>
                        </TouchableWithoutFeedback>
                      </Modal>
                    </>
                  )}
                  <View>
                    <Text style={styles.policyText}>By registering, you agree to the terms and conditions of the event.</Text>
                    {event.isPaid && event.refundPolicy && (
                      <Text style={styles.policyText}>
                        Refund Policy:
                        {event.refundPolicy.length > 0 ? (
                          <>
                            {event.refundPolicy.map((policy, index) => {
                              let policyText = ` ${policy.percentage}% in ${policy.days} days`;
                              if (index < event.refundPolicy.length - 1) {
                                policyText += ', ';
                              }
                              return policyText;
                            })}
                            {` and no refund after ${event.refundPolicy[event.refundPolicy.length - 1].days} days.`}
                          </>
                        ) : (
                          " No Refund Policy"
                        )}
                      </Text>
                    )}
                  </View>
                  <View style={styles.buttonContainer}>
                    <View style={styles.buttonWrapper}>
                      <Button title="Cancel" onPress={() => setModalVisible(false)} />
                    </View>
                    <View style={styles.buttonWrapper}>
                      <Button title="Confirm" onPress={handleConfirm} />
                    </View>
                  </View>
                </Animated.View>
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
    paddingBottom: 250,
    paddingLeft: 20,
    paddingRight: 20,
    flex: 1,
    backgroundColor: '#F9F7FE',
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
  conditionText: {
    fontSize: 14, // Smaller font size
    fontWeight: "bold", // Optional: make it lighter if needed
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
    flex: 1, // This makes the modal content take up the entire screen height
    width: '97%', // Ensures the modal content takes up the entire screen width
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10, // Removes the border radius for full-screen appearance
    elevation: 10,
  },
  modalTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
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
    color: '#AAA',
    paddingHorizontal: 10,
    paddingVertical: 12,
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
  errorMessage: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  pendingContainer: {
    alignSelf: "flex-end",
    marginTop: 10,
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    padding: 5,
  },
  pendingText: {
    fontSize: 10, // Adjust text size to fit inside the box
    textAlign: "center",
    color: "#555",
  },
});