import React, { useEffect, useState } from 'react';
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
  const { eventId } = route.params; // Access eventId from route params
  const [staffRoles, setStaffRoles] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    faculty: '',
    role: '', // roleId added to the form data
  });

  useEffect(() => {
    // Set loading to true before fetching data
    setLoading(true);

    // Fetch event details and staff roles in parallel
    Promise.all([
      fetch(`http://10.120.218.69:3000/api/events/${eventId}`),
      fetch(`http://10.120.218.69:3000/api/events/${eventId}/staffroles`),
    ])
      .then(([eventResponse, staffRolesResponse]) => {
        if (!eventResponse.ok || !staffRolesResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        return Promise.all([eventResponse.json(), staffRolesResponse.json()]);
      })
      .then(([eventData, staffRolesData]) => {
        setEvent(eventData);
        setStaffRoles(staffRolesData);
        setLoading(false); // Set loading to false after both requests are complete
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false); // Set loading to false on error
      });
  }, [eventId]);

  const handleRegister = (role) => {
    // Set the roleId in the formData state
    setFormData((prevState) => ({ ...prevState, role }));
    setModalVisible(true);
  };

  // Handle Form Submission
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
            fetch(`http://10.120.218.69:3000/api/events/${eventId}/staffs`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
              .then((response) => {
                if (response.ok) {
                  Alert.alert('Success', 'You have successfully registered!');
                  setModalVisible(false);
                  setFormData({ id: '', name: '', email: '', faculty: '', phone: '', role: '' }); // Reset form data
                } else {
                  Alert.alert('Error', 'Failed to register. Please try again.');
                }
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

  // Function to render each staff role card
  const renderStaffRoleCard = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.roleName}>{item.name}</Text>
      <Text>Count: {item.count}</Text>
      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => handleRegister(item._id)} // Pass the roleId when registering
      >
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={staffRoles}
        renderItem={renderStaffRoleCard}
        keyExtractor={(item) => item._id}
        numColumns={2} // Show two cards per row
        columnWrapperStyle={styles.row}
      />
      {/* Modal for Registration Form */}
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
            <TextInput
              style={styles.input}
              placeholder="Faculty"
              value={formData.faculty}
              onChangeText={(text) => setFormData({ ...formData, faculty: text })}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Submit" onPress={handleConfirm} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    backgroundColor: '#4CAF50',
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
    width: '80%',
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
});
