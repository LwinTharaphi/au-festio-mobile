import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
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

export default function StaffRolesScreen({ route }) {
  const navigation = useNavigation();
  const { organizerId, eventId } = route.params;
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
  const faculties = ['VMES', 'MSME', 'Arts', 'Music', 'Biotechnology', 'Law', 'Communication Arts', 'Architecture and Design', 'Nursing Science'];

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

        const roleCounts = staffsData.reduce((counts, staff) => {
          counts[staff.role.name] = (counts[staff.role.name] || 0) + 1;
          return counts;
        }, {});

        const updatedStaffRolesData = staffRolesData.map(role => ({
          ...role,
          roleCounts: roleCounts[role.name] || 0,
        }));

        setEvent(eventData);
        setStaffRoles(updatedStaffRolesData);
        setStaffData(staffsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizerId, eventId]);

  const handleRegister = (role) => {
    if (registeredRole) {
      Alert.alert('Sorry', 'You can only register one role.');
      return;
    }
    setFormData((prevState) => ({ ...prevState, role }));
    setModalVisible(true);
  };
  const requiredFields = ["id", "name", "email", "faculty", "phone"];
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
          onPress: () => {
            const payload = { ...formData, role: formData.role, event };
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
                setFormData({ id: '', name: '', email: '', faculty: '', phone: '', role: '' });
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

    return (
      <View style={styles.card}>
        <Text style={styles.roleName}>{item.name}</Text>
        <Text>Count: {item.count}</Text>
        <Text>Spots Left: {displaySpotsLeft}</Text>
        {registeredRole === item._id ? (
          <TouchableOpacity style={styles.registerButton} onPress={handleCancelRegistration}>
            <Text style={styles.registerButtonText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.registerButton, !isSpotsAvailable && { opacity: 0.7 }]}
            onPress={() => isSpotsAvailable && handleRegister(item._id)}
            disabled={!isSpotsAvailable}
          >
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [registeredRole, handleCancelRegistration, handleRegister]);

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
                    value={formData.id}
                    onChangeText={(text) => setFormData({ ...formData, id: text })}
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
    backgroundColor: '#FFFF',
    padding: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
