import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import EventCard from '../components/EventCard';
import { fetchEvents } from '../services/api';

export default function EventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents().then((data) => {
      // Flatten the events and include the organizerId for each event
      const eventsWithOrganizer = data.flatMap((organizer) =>
        organizer.events.map((event) => ({
          ...event,
          organizerId: organizer.organizer._id, // Include organizerId for each event
        }))
      );
      setEvents(eventsWithOrganizer);
    });
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => navigation.navigate('EventDetail', { 
              eventId: item._id, 
              organizerId: item.organizerId, // Pass organizerId to EventDetail
              hideTabs: true 
            })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});
