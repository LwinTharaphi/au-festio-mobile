import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import EventCard from '../components/EventCard';
import { fetchEvents } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme';
import { auth } from '../config/firebase';

export default function EventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState('registered');
  const [firebaseUserId, setFirebaseUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      console.log('Firebase user:', firebaseUser.uid);
      setFirebaseUserId(firebaseUser.uid);
    }

    if (firebaseUserId) {
      loadEvents();  // Load all events when firebaseUserId is available
    }
  }, [firebaseUserId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchEvents(firebaseUserId);
      // Flatten and filter events as required
      // console.log(data);
      const filteredAndSortedEvents = data.flatMap((organizer) =>
        organizer.events
          .filter((event) => {
            const eventDate = new Date(event.eventDate);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            return eventDate >= currentDate;
          })
          // console.log("event",event)
          .map((event) => ({
            ...event,
            organizerId: organizer.organizer._id,
            isRegistered: event.isRegistered,
          }))
      );
      setEvents(filteredAndSortedEvents);  // Set all events at once
      console.log("filteredAndSortedEvents",filteredAndSortedEvents);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) =>
    tab === 'registered' ? event.isRegistered : !event.isRegistered
  );

  return (
    <View style={styles.container}>
      <View className="flex-row justify-between items-center px-4 py-3">
        <Text className="text-xl font-bold text-gray-800">Au-Festio</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
          <Icon name="notifications" size={24} color={colors.button} />
        </TouchableOpacity>
      </View>

      <View className="flex-row border-b border-gray-300">
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${tab === 'registered' ? 'border-b-2 border-blue-500' : ''}`}
          onPress={() => setTab('registered')}
        >
          <Text className={`text-lg ${tab === 'registered' ? 'text-blue-500 font-bold' : 'text-gray-500'}`}>
            Registered Events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${tab === 'unregistered' ? 'border-b-2 border-blue-500' : ''}`}
          onPress={() => setTab('unregistered')}
        >
          <Text className={`text-lg ${tab === 'unregistered' ? 'text-blue-500 font-bold' : 'text-gray-500'}`}>
            Unregistered Events
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() =>
              navigation.navigate('EventDetail', {
                eventId: item._id,
                organizerId: item.organizerId,
                hideTabs: true,
              })
            }
          />
        )}
        ListFooterComponent={loading && <ActivityIndicator size="large" color={colors.button} />}
        contentContainerStyle={{ padding: 10 }}
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
