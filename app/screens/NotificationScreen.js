import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const storedNotifications = JSON.parse(await AsyncStorage.getItem('notifications')) || [];
      setNotifications(storedNotifications);
      console.log('Notifications loaded:', storedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      console.log('Deleting notification:', notificationId);
      const updatedNotifications = notifications.filter(
        (notification) => `${notification.data.eventId}-${notification.data.type}` !== notificationId
      );
      console.log('Deleted notifications:', updatedNotifications);
      setNotifications(updatedNotifications);
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications)); // Save updated list to AsyncStorage
      console.log('Notifications after deletion:', notifications);
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await AsyncStorage.removeItem('notifications');
      setNotifications([]);
      console.log('All notifications deleted');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      'Delete All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: deleteAllNotifications, style: 'destructive' },
      ]
    );
  };

  const confirmDelete = (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteNotification(notificationId), style: 'destructive' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Notification History</Text>
        <TouchableOpacity onPress={confirmDeleteAll} style={styles.deleteAllButton}>
          <Icon name="delete-sweep" size={24} color="#ff5252" />
        </TouchableOpacity>
      </View>
      {notifications.length === 0 ? (
        <Text style={styles.noNotifications}>No notifications to display.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => `${item.data.eventId}-${item.data.type}`} // Use eventId as a unique identifier
          renderItem={({ item }) => (
            <View style={styles.notificationItem}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </View>
              <TouchableOpacity onPress={() => confirmDelete(`${item.data.eventId}-${item.data.type}`)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>:</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  deleteAllButton: {
    padding: 10,
  },
  noNotifications: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 16,
    color: '#555',
  },
  deleteButton: {
    padding: 10,
  },
  deleteText: {
    fontSize: 24,
    color: '#ff5252',
  },
});