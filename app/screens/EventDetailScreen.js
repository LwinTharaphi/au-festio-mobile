import React, { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Button,
  Modal,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';

export default function EventDetailScreen({ route }) {
  const { eventId } = route.params;
  const {organizerId} = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    faculty: '',
    phone: '',
  });
  const [isRegistered, setIsRegistered] = useState(false);
  const [studentId, setStudentId] = useState(null); // State to store student ID
  const faculties = ['VMES', 'MSME', 'Arts', 'Music', 'Biotechnology', 'Law', 'Communication Arts', 'Architecture and Design', 'Nursing Science'];

  useEffect(() => {
    // Fetch event details
    fetch(`http://10.120.216.243:3000/api/organizers/${organizerId}/events/${eventId}`)
      .then((response) => response.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching event details:', error);
        setLoading(false);
      });
  }, [organizerId,eventId]);

  const handleRegister = () => {
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
            const payload = { ...formData, eventId };
            fetch(`http://10.120.216.243:3000/api/organizers/${organizerId}/events/${eventId}/students`, {
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
            fetch(`http://10.120.216.243:3000/api/organizers/${organizerId}/events/${eventId}/students/${studentId}`, {
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
        source={{ uri: `http://10.120.216.243:3000/uploads/posters/${event.posterName}` }}
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
