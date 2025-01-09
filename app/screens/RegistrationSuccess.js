import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const RegistrationSuccess = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params;
  const { organizerId } = route.params;
  const [event, setEvent] = useState(null);
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

  return (
    <View style={styles.container}>
      <View style={styles.successIconContainer}>
        <MaterialIcons name="check-circle" size={100} color="green" />
      </View>
      <Text style={styles.successMessage}>
        You have registered successfully for {event.eventName}.
      </Text>
      <TouchableOpacity
        style={styles.okButton}
        onPress={() => navigation.navigate('EventDetail', { eventId, organizerId })}
      >
        <Text style={styles.okButtonText}>OK</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successMessage: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    marginBottom: 30,
  },
  okButton: {
    backgroundColor: 'green',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  okButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegistrationSuccess;
