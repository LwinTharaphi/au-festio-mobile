import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function BoothListScreen({ route }) {
  const { organizerId, eventId } = route.params;
  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [organizerId, eventId]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const renderBoothCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.boothTitle}>Booth {item.boothNumber}</Text>
      </View>
      <Image
        source={{ uri: `${item.imagePath}` }}
        style={styles.poster}
      />
      <View style={styles.infoContainer}>
        <View style={styles.leftSide}>
          <Text style={styles.boothName}>{item.boothName}</Text>
          <Text style={styles.item}>{item.item}</Text>
        </View>
        <View style={styles.rightSide}>
          <View style={styles.locationRow}>
            <Icon name="location-on" size={16} color="#333" style={styles.icon} />
            <Text style={styles.location}>{item.location}</Text>
          </View>
          <View style={styles.priceRow}>
          <Icon name="monetization-on" size={16} color="#333" style={styles.icon} />
            <Text style={styles.priceRange}>{item.priceRange} THB</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Page Title */}
      <Text style={styles.pageTitle}>Booths</Text>

      {/* Booth List */}
      <FlatList
        data={booths}
        renderItem={renderBoothCard}
        keyExtractor={(item) => item.boothId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingTop: 10, // Ensure there is space at the top for the title
    backgroundColor: '#F9F7FE',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 15,
    marginVertical: 10,
  },
  card: {
    marginBottom: 15,
    marginHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    padding: 10,
    borderColor: '#A67EEC', // Border color
    borderWidth: 1, // Border width to make the color visible
  },
  headerContainer: {
    flexDirection: 'row', // Align title and number horizontally
    justifyContent: 'space-between', // Space them out
    marginBottom: 10, // Space between header and card content
  },
  boothTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row', // Align booth name/item and location/price in a row
    justifyContent: 'space-between', // Space them out
    alignItems: 'center', // Center align content vertically
  },
  leftSide: {
    flex: 1,
    justifyContent: 'flex-start', // Align to the left
  },
  rightSide: {
    flex: 1,
    justifyContent: 'flex-end', // Align to the right
    alignItems: 'flex-end', // Align text to the right
  },
  poster: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
    borderRadius: 5,
    marginBottom: 10,
  },
  boothName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  item: {
    fontSize: 14,
    color: '#777',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
  },
  priceRange: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
  },
  icon: {
    marginRight: 5,
  },
});
