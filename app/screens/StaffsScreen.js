import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Button,
  ScrollView,
  Animated,
} from 'react-native';
import { auth } from '../config/firebase'
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StaffRolesScreen({ route }) {
  const navigation = useNavigation();
  const { organizerId, eventId, expoPushToken } = route.params;
  const [staffRoles, setStaffRoles] = useState([]);
  const [event, setEvent] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const formContainer = useRef(new Animated.Value(0)).current;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    faculty: '',
    role: '',
  });
  const [registeredRole, setRegisteredRole] = useState(null);
  const [staffId, setStaffId] = useState(null);
  const [status, setStatus] = useState(null);
  const [registrationDate, setRegistrationDate] = useState(null);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const eventResponse = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}`);
        const staffRolesResponse = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/staffroles`);
        const staffsResponse = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/staffs`);

        if (!eventResponse.ok || !staffRolesResponse.ok || !staffsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [eventData, staffRolesData, staffsData] = await Promise.all([eventResponse.json(), staffRolesResponse.json(), staffsResponse.json()]);

        // Check if the current user's ID matches any firebaseUID in staffData
        const currentUserStaff = staffsData.find(staff => staff.firebaseUID === user?.uid);

        // const roleCounts = staffsData.reduce((counts, staff) => {
        //   counts[staff.role.name] = (counts[staff.role.name] || 0) + 1;
        //   return counts;
        // }, {});
        const roleCounts = staffsData.reduce((counts, staff) => {
          const roleName = staff.role.name;
          
          // Only increase count if status is NOT "rejected"
          if (staff.status !== "rejected") {
            counts[roleName] = (counts[roleName] || 0) + 1;
          }
        
          return counts;
        }, {});
        

        const updatedStaffRolesData = staffRolesData.map(role => ({
          ...role,
          roleCounts: roleCounts[role.name] || 0,
        }));

        setEvent(eventData);
        setStaffRoles(updatedStaffRolesData);
        setStaffData(currentUserStaff);
        setRegisteredRole(currentUserStaff?.role._id);
        setStaffId(currentUserStaff?._id);
        setStatus(currentUserStaff?.status);
        if (currentUserStaff?.createdAt) {
          const parsedDate = new Date(currentUserStaff.createdAt);
          if (!isNaN(parsedDate)) {
            setRegistrationDate(parsedDate);
          } else {
            console.error("Invalid date format:", currentUserStaff.createdAt);
          }
        } else {
          console.warn("createdAt is missing for currentUserStaff");
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [organizerId, eventId, user]);

  const handleRegister = (role) => {
    if (registeredRole) {
      Alert.alert('Sorry', 'You can only register one role.');
      return;
    }
    setFormData((prevState) => ({ ...prevState, role }));
    setModalVisible(true);
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

  const handleConfirm = () => {
    console.log("Event Data", event);
    console.log("Staff Roles", staffRoles);
    console.log("Staff Data", staffData);
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
          onPress: async () => {
            const firebaseUID = user?.uid;
            await AsyncStorage.setItem(`formData_${firebaseUID}`, JSON.stringify(formData));
            const payload = { ...formData, role: formData.role, event, firebaseUID, expoPushToken };
            console.log("Payload", payload);
            fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/staffs`, {
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
                const updatedStaffRolesData = staffRoles.map(role => {
                  if (role._id === formData.role) {
                    return { ...role, roleCounts: role.roleCounts + 1 }; // Increase count for registered role
                  }
                  return role;
                });
                navigation.navigate('RegistrationSuccess', { eventId, organizerId });

                const timer = setTimeout(() => {
                  navigation.navigate('EventDetail', { eventId, organizerId });
                }, 4000);

                setStaffRoles(updatedStaffRolesData);
                setModalVisible(false);
                setRegisteredRole(formData.role);
                setStaffId(data._id);
                setFormData({ sid: '', name: '', email: '', faculty: '', phone: '', role: '' });
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
            const firebaseUID = user?.uid;
            fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/staffs/${staffId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
            })
              .then((response) => {
                if (response.ok) {
                  // Update the roleCounts after cancellation
                  const updatedStaffRolesData = staffRoles.map(role => {
                    if (role._id === registeredRole) {
                      return { ...role, roleCounts: role.roleCounts - 1 }; // Decrease count for the cancelled role
                    }
                    return role;
                  });
                  setStaffRoles(updatedStaffRolesData);
                  Alert.alert('Success', 'Your registration has been cancelled.');
                  setRegisteredRole(null);
                  setStaffId(null);
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

  const renderStaffRoleCard = useCallback(({ item }) => {
    const spotsLeft = item.count - item.roleCounts;
    const displaySpotsLeft = Math.max(spotsLeft, 0);
    const isSpotsAvailable = displaySpotsLeft > 0;

    // Determine button text based on status
    let buttonText = "Register";
    if (registeredRole === item._id) {
      if (status === "not viewed") {
        buttonText = "Pending";
      } else if (status === "approved") {
        buttonText = "Approved";
      } else if (status === "rejected") {
        buttonText = "Rejected";
      }
       else {
        buttonText = "Cancel";
      }
    }
    // Check if the user can cancel registration
    const currentDate = new Date();
    const timeDiff = Math.abs(currentDate - registrationDate);
    const daysSinceRegistration = timeDiff / (1000 * 60 * 60 * 24);
    const canCancel = daysSinceRegistration <= 1;

    return (
      <View style={styles.card}>
        <Text style={styles.roleName}>{item.name}</Text>
        <Text>Count: {item.count}</Text>
        <Text>Spots Left: {displaySpotsLeft}</Text>

        <TouchableOpacity
          style={[
            styles.registerButton,
            !isSpotsAvailable && buttonText === "Register" && { opacity: 0.7 }
          ]}
          onPress={() =>
            registeredRole === item._id
              ? handleCancelRegistration()
              : isSpotsAvailable && handleRegister(item._id)
          }
          disabled={buttonText === "Approved" || buttonText === "Pending" || buttonText === "Rejected" || (buttonText === "Register" && !isSpotsAvailable)}
        >
          <Text style={styles.registerButtonText}>{buttonText}</Text>
        </TouchableOpacity>

        {registeredRole === item._id && buttonText !== "Register" && buttonText !== "Rejected" && canCancel && (
          <TouchableOpacity onPress={handleCancelRegistration}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [registeredRole, status, handleCancelRegistration, handleRegister]);


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
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Staffs</Text>
      <FlatList
        data={staffRoles}
        renderItem={renderStaffRoleCard}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        extraData={registeredRole}
      />
      {modalVisible && (
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
                <Text style={styles.modalTitle}>Register for Event</Text>
                <Animated.View
                  style={{
                    transform: [{ translateX: formContainer }], // Apply the shake animation to the form container
                  }}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="ID"
                    value={formData.sid}
                    onChangeText={(text) => setFormData({ ...formData, sid: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    keyboardType="email-address"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
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
                  <Text style={styles.policyText}>Note: You can only cancel your registration within three days. </Text>
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
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7FE',
    padding: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 15,
    marginVertical: 10,
  },
  card: {
    flex: 1,
    margin: 10,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: '45%',
    borderColor: '#A67EEC', // Border color
    borderWidth: 1, // Border width to make the color visible
  },

  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  registerButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#A67EEC',
    borderRadius: 5,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelText: {
    fontSize: 12,
    color: '#A67EEC',
    textDecorationLine: "underline",
    textAlign: "center"
  },
  policyText: {
    fontSize: 10, // small font size
    color: 'red', // red color
    marginTop: 10, // optional, adds some spacing above the text
    marginBottom: 10, // optional, adds some spacing
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
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
  errorMessage: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
});
