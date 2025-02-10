import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const RegistrationSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, organizerId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      {event && event.eventName ? (
        <View style={[styles.successIconContainer, { marginBottom: 20 }]}>
          <Text style={styles.successMessage}>
            {event.isPaid
              ? `We have received your registration for ${event.eventName}.\nWe will review and notify you shortly.`
              : `Your registration for ${event.eventName} is successful!`}
          </Text>
        </View>
      ) : (
        <Text style={styles.successMessage}>Event details not available.</Text>
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
  successIconContainer: {
    alignItems: 'center',
  },
});

export default RegistrationSuccessScreen;
