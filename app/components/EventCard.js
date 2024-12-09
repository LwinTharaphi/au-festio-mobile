import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

export default function EventCard({ event, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      {/* Event Poster */}
      <Image
        source={{ uri: `http://10.120.137.135:3000${event.poster}` }} // Replace with correct server IP
        style={styles.poster}
      />
      {/* Event Title */}
      <Text style={styles.title}>{event.eventName}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
  },
  poster: {
    width: '100%',
    height: 150,
    resizeMode: 'cover', // Ensures the image fills the space proportionally
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
  },
});
