import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';

export default function EventDetailScreen({ route }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch event details
    fetch(`http://10.120.218.69:3000/api/events/${eventId}`)
      .then((response) => response.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching event details:', error);
        setLoading(false);
      });
  }, [eventId]);

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

  // const posterUri = `data:image/jpeg;base64,${Buffer.from(event.poster.data).toString('base64')}`;
  // const posterUri = `data:image/jpeg;base64,${event.poster.data
  //   .map((byte) => String.fromCharCode(byte))
  //   .join('')}`;

  return (
    <View style={styles.container}>
      {/* Event Poster */}
      <Image
        source={{ uri: `http://10.120.218.69:3000/uploads/posters/${event.posterName}` }}
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
    </View>
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
});
