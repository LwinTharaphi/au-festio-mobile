import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';

export default function StaffRolesScreen({ route }) {
  const { eventId } = route.params; // Access eventId from route params
  const [staffRoles, setStaffRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch staff roles data from the API
    fetch(`http://10.120.218.69:3000/api/events/${eventId}/staffroles`)
      .then((response) => response.json())
      .then((data) => {
        setStaffRoles(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching staff roles:', error);
        setLoading(false);
      });
  }, [eventId]); // Refetch when eventId changes

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Function to render each staff role card
  const renderStaffRoleCard = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.roleName}>{item.name}</Text>
      <Text>Count: {item.count}</Text>
      <TouchableOpacity style={styles.registerButton}>
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={staffRoles}
        renderItem={renderStaffRoleCard}
        keyExtractor={(item) => item._id}
        numColumns={2} // Show two cards per row
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flex: 1,
    margin: 10,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    justifyContent: 'space-between', // To ensure equal spacing between the two cards
  },
  registerButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
