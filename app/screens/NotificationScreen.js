// screens/NotificationScreen.js

import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const NotificationScreen = ({ route }) => {
  const { notifications } = route.params; // Get notifications passed via route params

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <View style={styles.notificationItem}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text>{item.body}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  notificationItem: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f4f4f4',
  },
  notificationTitle: {
    fontWeight: 'bold',
  },
});

export default NotificationScreen;
