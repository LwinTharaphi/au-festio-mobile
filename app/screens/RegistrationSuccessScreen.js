import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const RegistrationSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, organizerId } = route.params;  // Destructure both params in one line
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);  // Add a loading state

  useEffect(() => {
    // Fetch event details
    fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}`)
      .then((response) => response.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);  // Set loading to false after data is fetched
      })
      .catch((error) => {
        console.error('Error fetching event details:', error);
        setLoading(false);
      });
  }, [organizerId, eventId]);

  // If still loading, show a loading spinner
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.successIconContainer, { marginBottom: 20 }]}>
        <MaterialIcons name="check-circle-outline" size={150} color="green" />
      </View>
      {event && event.eventName ? (  // Ensure event data is available
      <View style={[styles.successIconContainer, { marginBottom: 20 }]}>
        <Text style={styles.successMessage}>
          We have received your registration for {event.eventName}.
        </Text>
        <Text style={styles.successMessage}>
        We will review and notify you shortly.
      </Text>
      </View>
      ) : (
        <Text style={styles.successMessage}>Event details not available.</Text>  // Fallback message
      )}
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
  successMessage: {
    fontSize: 18,
    fontWeight: 'bold',
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

export default RegistrationSuccessScreen;
