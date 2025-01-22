import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import EventCard from '../components/EventCard';
import { fetchEvents } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme';
import { auth } from '../config/firebase';
import io from 'socket.io-client';
import { useFocusEffect } from '@react-navigation/native';

export default function EventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState('registered');
  const [firebaseUserId, setFirebaseUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRegisteredUpdated, setIsRegisteredUpdated] = useState(false);

  useEffect(() => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      console.log('Firebase user:', firebaseUser.uid);
      setFirebaseUserId(firebaseUser.uid);
    }

    const socket = io('https://au-festio.vercel.app');
    console.log('Socket:', socket);

    socket.on('eventDataUpdated', () => {
      console.log('Socket connected:', socket.id);
    });
    // if (firebaseUserId) {
    //   loadEvents();  // Load all events when firebaseUserId is available
    // }
    return () => {
      socket.disconnect();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (firebaseUserId) {
        loadEvents();  // Load all events when firebaseUserId is available
      }
    }, [firebaseUserId,isRegisteredUpdated])
  );

  const loadEvents = async () => {
    if (!firebaseUserId || !hasMore || loading) return;
    setLoading(true);
    try {
      const data = await fetchEvents(firebaseUserId, page, 10);
      // Flatten and filter events as required
      // console.log(data);
      if (data.length === 0) {
        setHasMore(false);
      } else {
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
        const uniqueEvents = filteredAndSortedEvents.filter((event, index, self) =>
          index === self.findIndex((e) => e._id === event._id)
        );
        console.log("uniqueEvents",uniqueEvents);
        if (uniqueEvents.length === 0) {
          setHasMore(false);
        } else {
          setEvents((prevEvents) => [...prevEvents, ...uniqueEvents.filter((newEvent) => !prevEvents.some((existingEvent) => existingEvent._id === newEvent._id))]);
          setPage((prevPage) => prevPage + 1);
          // console.log("events",events);
        }
      }
      // setEvents(filteredAndSortedEvents);  // Set all events at once
      // console.log("filteredAndSortedEvents",filteredAndSortedEvents);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => (tab === 'registered' ? event.isRegistered : !event.isRegistered));

  // Disable infinite scrolling when all events are loaded
  const shouldLoadMore = hasMore && !loading;

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

      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.button} />
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={styles.noEventsContainer}>
          <Text style={styles.noEventsText}>
            {tab === 'registered' ? 'No events registered' : 'No events available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => `${item._id}`}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() =>
                navigation.navigate('EventDetail', {
                  eventId: item._id,
                  organizerId: item.organizerId,
                  hideTabs: true,
                  onRegister: () => setIsRegisteredUpdated(true),
                })
              }
            />
          )}
          onEndReached={hasMore && !loading ? loadEvents : null}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading && <ActivityIndicator size="large" color={colors.button} />}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});
