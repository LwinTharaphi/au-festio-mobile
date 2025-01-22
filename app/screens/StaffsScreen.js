import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';

export default function StaffRolesScreen({ route }) {
  const navigation = useNavigation();
  const { organizerId, eventId } = route.params;
  const [staffRoles, setStaffRoles] = useState([]);
  const [event, setEvent] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
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
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Register</Text>
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
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
              />
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.faculty}
                  onValueChange={(value) => setFormData({ ...formData, faculty: value })}
                >
                  {faculties.map((faculty) => (
                    <Picker.Item key={faculty} label={faculty} value={faculty} />
                  ))}
                </Picker>
              </View>
              <Button title="Confirm" onPress={handleConfirm} />
            </View>
          </View>
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
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
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
});
