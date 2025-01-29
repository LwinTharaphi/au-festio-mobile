import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import EventCard from '../components/EventCard';
import { fetchEvents } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme';
import { auth } from '../config/firebase';
import io from 'socket.io-client';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { setShouldAnimateExitingForTag } from 'react-native-reanimated/lib/typescript/core';


export default function EventsScreen({ navigation, route }) {
  const { expoPushToken } = route.params || {};
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState('registered');
  const [firebaseUserId, setFirebaseUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRegisteredUpdated, setIsRegisteredUpdated] = useState(false);
  // const [scheduleNotifications, setScheduleNotifications] = useState(new Set());

  useEffect(() => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      console.log('Firebase user:', firebaseUser.uid);
      setFirebaseUserId(firebaseUser.uid);
    }

    const socket = io('https://au-festio.vercel.app');
    // console.log('Socket:', socket);

    socket.on('eventDataUpdated', () => {
      console.log('Socket connected:', socket.id);
    });
    // if (firebaseUserId) {
    //   loadEvents();  // Load all events when firebaseUserId is available
    // }
    return () => {
      socket.disconnect();
    };
  }, [events]);

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
        // console.log("Data",data);
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
        // console.log("filteredAndSortedEvents",filteredAndSortedEvents);
        const uniqueEvents = filteredAndSortedEvents.filter((event, index, self) =>
          index === self.findIndex((e) => e._id === event._id)
        );
        // console.log("uniqueEvents",uniqueEvents);
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

  const saveNotificationToStorage = async (notification) => {
    try{
      const storedNotifications = JSON.parse(await AsyncStorage.getItem('notifications')) || [];

      const normalizedNotification = {
        title: notification.title,
        body: notification.body,
        data: {
          eventId: notification.data.eventId,
          type: notification.data.type,
          organizerId: notification.data.organizerId,
        },
        timestamp: notification.timestamp || new Date().toLocaleDateString(),
        autoDismiss: notification.autoDismiss || false,
        sound: notification.sound || 'default',
        sticky: notification.sticky || false,
      };
      // console.log('Normalized notification:', normalizedNotification);
      // Check if the type is empty
      if (!normalizedNotification.data.type) {
        console.log('Notification type is empty, not storing:', normalizedNotification);
        return;
      }
      const isDuplicate = storedNotifications.some((n) => n.data.eventId === normalizedNotification.data.eventId && n.data.type === normalizedNotification.data.type);

      if (!isDuplicate) {
        const updatedNotifications = [normalizedNotification, ...storedNotifications];
        // console.log('Updated notifications:', updatedNotifications);
        await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }
    } catch (error) {
      console.error('Failed to save notification:', error);
    }
  };

  const scheduleNotificationsLogic = async () => {
    const currentTime = new Date();
    // console.log('Current time:', currentTime);
    const currentDate = currentTime.toLocaleDateString().split('T')[0];
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    // console.log('Current date:', currentDate);
    // console.log('Current time:', currentHours, currentMinutes);

    const notifications = JSON.parse(await AsyncStorage.getItem('notifications')) || [];
    for (const event of events) {
      if (event.isRegistered) {
        // console.log('Event:', event.eventName, event.eventDate, event.endTime, event.organizerId);
        const eventDate = new Date(event.eventDate).toLocaleDateString().split('T')[0];
        const endTime = event.endTime
        const startTime = event.startTime
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);

        const notificationStartTime = new Date(event.eventDate);
        notificationStartTime.setHours(startHours, startMinutes-5);

        const notificationEndTime = new Date(event.eventDate);
        notificationEndTime.setHours(endHours, endMinutes+5);
        // console.log("OrganizerId",event.organizerId);
        // console.log('Event date:', eventDate);
        // console.log('Event end time:', endTime);
        // console.log('Event end time+ 5 minutes:', notificationEndTime.toLocaleTimeString());
        // console.log('Event start time:', startTime);
        // console.log('Event start time-5 minutes:', notificationStartTime.toLocaleTimeString(),notificationStartTime.getHours(),notificationStartTime.getMinutes());
        // console.log('Current time:', currentTime.toLocaleTimeString());

        // Schedule notification for event start
        if (eventDate === currentDate && !notifications.some((n)=> n.data.type === 'event-reminder' && n.data.eventId === event._id)) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Event Reminder',
              body: `Today is the day for event ${event.eventName}!`,
              data: { eventId: event._id, type: 'event-reminder', organizerId: event.organizerId },
            },
            trigger: { date: eventDate },
          });
          saveNotificationToStorage({ title: 'Event Reminder', body: `Today is the day for event ${event.eventName}!`, type: 'event-reminder',timestamp: currentTime.toLocaleDateString(), data: { eventId: event._id, organizerId: event.organizerId } });
          console.log('Notification scheduled for event start:', event.eventName);
        }

        // Schedule notification for event end
        if (eventDate === currentDate && notificationEndTime > currentTime && !notifications.some((n)=> n.data.type === 'feedback-reminder' && n.data.eventId === event._id)) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Feedback Reminder',
              body: `Event ${event.eventName} has ended. Please provide your feedback!`,
              data: { eventId: event._id, type: 'feedback-reminder',organizerId: event.organizerId},
            },
            trigger: { date: notificationEndTime.getTime() },
          });
          saveNotificationToStorage({ title: 'Feedback Reminder', body: `Event ${event.eventName} has ended. Please provide your feedback!`, type: 'feedback-reminder', timestamp: notificationStartTime.toLocaleDateString(), data: { eventId: event._id, organizerId: event.organizerId } });
          console.log('Notification scheduled for event end:', event.eventName);
        }
        // setScheduleNotifications((prevNotifications) => new Set([...prevNotifications, event._id]));
      }
    }
  };

  useEffect(() => {
    if (expoPushToken && events.length > 0) {
      scheduleNotificationsLogic();
    }
  }, [expoPushToken, events]);

  const filteredEvents = events.filter((event) => (tab === 'registered' ? event.isRegistered : !event.isRegistered));

  // Disable infinite scrolling when all events are loaded
  const shouldLoadMore = hasMore && !loading;

  useEffect(() => {
    const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      saveNotificationToStorage(notification.request.content);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const { eventId, type } = response.notification.request.content.data;
      console.log('Notification response received:', response, eventId, type);
      navigation.navigate('Notification', { eventId, type });
    });
    return () => {
      notificationSubscription.remove();
      subscription.remove();
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View className="flex-row justify-between items-center px-4 py-3">
        <Text className="text-xl font-bold text-gray-800">Au-Festio</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NotificationStack')}>
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
                  isRegistered: item.isRegistered,
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
