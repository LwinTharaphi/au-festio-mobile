import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';

export default function BoothListScreen({ route }) {
  const { organizerId, eventId } = route.params; // Access route.params to get the eventId
  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch booths data from the API
    fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/booths`)
      .then((response) => response.json())
      .then((data) => {
        setBooths(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching booths:', error);
        setLoading(false);
      });
  }, [organizerId, eventId]); // Add eventId as a dependency to refetch when it changes

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Function to render each booth card
  const renderBoothCard = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: `${item.imagePath}` }}
        style={{ width: '100%', height: 100, borderRadius: 5, marginBottom: 10 }}
        resizeMode="cover"
      />
      <Text style={styles.boothName}>{item.boothName}</Text>
      <Text>Booth Number: {item.boothNumber}</Text>
      {/* <Text>Status: {item.status}</Text> */}
      <Text>Vendor: {item.vendorName}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={booths}
        renderItem={renderBoothCard}
        keyExtractor={(item) => item.boothId}
        numColumns={2} // Show two cards per row
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFF',
    padding: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flex: 1,
    margin: 2,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: '50%',
    borderColor: '#A67EEC', // Border color
    borderWidth: 1, // Border width to make the color visible
  },
  boothName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    justifyContent: 'space-between', // To ensure equal spacing between the two cards
  },
  cardButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
