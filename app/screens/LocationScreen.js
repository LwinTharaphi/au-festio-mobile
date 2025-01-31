import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TextInput,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking'; // Import Linking for deep linking
import ARNavigation from './ARNavigation';

const { width, height } = Dimensions.get('window'); // Define width and height

const markers = [
  // Your marker data here...
];

// Function to calculate distance between two coordinates (in meters)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export default function LocationScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [directions, setDirections] = useState([]);
  const [steps, setSteps] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showARNavigation, setShowARNavigation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSteps, setShowSteps] = useState(false);

  const mapRef = useRef(null);

  // Load favorites from AsyncStorage on component mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const savedFavorites = await AsyncStorage.getItem('favorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    };
    loadFavorites();
  }, []);

  // Save favorites to AsyncStorage whenever they change
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }
    };
    saveFavorites();
  }, [favorites]);

  // Fetch user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
      setIsLoading(false);
    })();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredMarkers = markers.filter((marker) =>
    marker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarkerPress = (marker) => {
    console.log('Marker pressed:', marker); // Debugging
    setSelectedMarker(marker);
    setShowDetails(true);
    Keyboard.dismiss();
  };

  const fetchRoute = async (start, end) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map((coord) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setDirections(coordinates);

        // Extract steps for turn-by-turn directions
        const steps = data.routes[0].legs[0].steps.map((step) => step.maneuver.instruction);
        setSteps(steps);
      } else {
        console.error('No route found');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const calculateDirections = () => {
    if (location && selectedMarker) {
      const start = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      const end = {
        latitude: selectedMarker.latitude,
        longitude: selectedMarker.longitude,
      };
      fetchRoute(start, end);
    }
  };

  const clearDirections = () => {
    setDirections([]);
    setSteps([]);
    setShowSteps(false);
  };

  const toggleFavorite = (marker) => {
    if (favorites.includes(marker.id)) {
      setFavorites(favorites.filter((id) => id !== marker.id));
    } else {
      setFavorites([...favorites, marker.id]);
    }
  };

  const handleARNavigation = () => {
    setShowARNavigation(true);
    setShowDetails(false);
    Keyboard.dismiss();
  };

  const handleShowFavorites = () => {
    setShowFavorites(true);
    Keyboard.dismiss();
  };

  const handleCloseFavorites = () => {
    setShowFavorites(false);
  };

  const removeAllFavorites = () => {
    setFavorites([]);
  };

  // Share Location Function
  const shareLocation = async () => {
    console.log('Share button clicked'); // Debugging
    if (selectedMarker) {
      console.log('Selected Marker:', selectedMarker); // Debugging
      const locationText = `Location: ${selectedMarker.name}\nLatitude: ${selectedMarker.latitude}\nLongitude: ${selectedMarker.longitude}`;
      console.log('Sharing text:', locationText); // Debugging

      try {
        // Save the text to a file
        const fileUri = FileSystem.documentDirectory + 'location.txt';
        await FileSystem.writeAsStringAsync(fileUri, locationText);

        // Share the file
        await Sharing.shareAsync(fileUri, {
          dialogTitle: 'Share Location',
        });
        console.log('Sharing successful'); // Debugging
      } catch (error) {
        console.error('Sharing failed:', error); // Debugging
      }
    } else {
      console.error('No marker selected'); // Debugging
    }
  };

  // Share Current Location and Open in Maps
  const shareCurrentLocation = async () => {
    if (location) {
      const { latitude, longitude } = location;

      // Generate deep links based on the platform
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${latitude},${longitude}`,
        android: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      });

      // Open the map app
      try {
        await Linking.openURL(url);
        console.log('Opened map successfully');
      } catch (error) {
        console.error('Error opening map:', error);
      }
    } else {
      console.error('No current location available');
    }
  };

  const favoriteMarkers = markers.filter((marker) => favorites.includes(marker.id));

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (showARNavigation && selectedMarker) {
    return (
      <ARNavigation
        destination={selectedMarker}
        onBack={() => setShowARNavigation(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={[styles.searchInput, { color: 'black' }]}
          placeholder="Search locations..."
          placeholderTextColor="gray"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="black" style={styles.clearIcon} />
          </TouchableOpacity>
        )}
        <Ionicons name="search" size={20} color="black" />
      </View>

      {/* Favorites Button */}
      <TouchableOpacity style={styles.favoritesButton} onPress={handleShowFavorites}>
        <Ionicons name="heart" size={24} color="red" />
        <Text style={styles.favoritesButtonText}>View Favorites</Text>
      </TouchableOpacity>

      {/* Get Your Location Button */}
      <TouchableOpacity
        style={styles.getLocationButton}
        onPress={() => {
          if (location) {
            mapRef.current.animateToRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            });
          }
        }}
      >
        <Ionicons name="locate" size={24} color="blue" />
      </TouchableOpacity>

      {/* Share Current Location Button */}
      <TouchableOpacity
        style={styles.shareCurrentLocationButton}
        onPress={shareCurrentLocation}
      >
        <Ionicons name="share-social" size={24} color="green" />
        <Text style={styles.shareCurrentLocationButtonText}>Share Current Location</Text>
      </TouchableOpacity>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location ? location.latitude : 13.611652749054086,
          longitude: location ? location.longitude : 100.83792247449529,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
        onPress={() => Keyboard.dismiss()}
      >
        {filteredMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.name}
            onPress={() => handleMarkerPress(marker)}
            pinColor={favorites.includes(marker.id) ? 'red' : 'blue'}
          />
        ))}
        {directions.length > 0 && (
          <Polyline coordinates={directions} strokeWidth={3} strokeColor="red" />
        )}
      </MapView>

      {/* Marker Details Modal */}
      <Modal visible={showDetails} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedMarker?.name}</Text>
            {location && selectedMarker && (
              <Text style={styles.distanceText}>
                Distance: {calculateDistance(
                  location.latitude,
                  location.longitude,
                  selectedMarker.latitude,
                  selectedMarker.longitude
                ).toFixed(2)} meters
              </Text>
            )}
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={calculateDirections}
            >
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
            {steps.length > 0 && (
              <TouchableOpacity
                style={styles.toggleStepsButton}
                onPress={() => setShowSteps(!showSteps)}
              >
                <Text style={styles.toggleStepsButtonText}>
                  {showSteps ? 'Hide Steps' : 'Show Steps'}
                </Text>
              </TouchableOpacity>
            )}
            {showSteps && steps.length > 0 && (
              <FlatList
                data={steps}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <Text style={styles.stepText}>{item}</Text>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.clearDirectionsButton}
              onPress={clearDirections}
            >
              <Text style={styles.clearDirectionsButtonText}>Clear Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.arButton}
              onPress={handleARNavigation}
            >
              <Text style={styles.arButtonText}>Start AR Navigation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(selectedMarker)}
            >
              <Text style={styles.favoriteButtonText}>
                {favorites.includes(selectedMarker?.id) ? 'Remove Favorite' : 'Add to Favorites'}
              </Text>
            </TouchableOpacity>
            {/* Share Location Button */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareLocation}
            >
              <Text style={styles.shareButtonText}>Share Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetails(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Favorites Modal */}
      <Modal visible={showFavorites} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Favorites</Text>
            <FlatList
              data={favoriteMarkers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.favoriteItem}
                  onPress={() => {
                    setSelectedMarker(item);
                    setShowFavorites(false);
                    setShowDetails(true);
                  }}
                >
                  <Text style={styles.favoriteItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.removeAllButton}
              onPress={removeAllFavorites}
            >
              <Text style={styles.removeAllButtonText}>Remove All Favorites</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseFavorites}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: width,
    height: height,
  },
  searchBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    zIndex: 1,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
  },
  clearIcon: {
    marginRight: 10,
  },
  favoritesButton: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    elevation: 3,
  },
  favoritesButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: 'red',
    fontWeight: 'bold',
  },
  getLocationButton: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    zIndex: 1,
    elevation: 3,
  },
  shareCurrentLocationButton: {
    position: 'absolute',
    top: 160,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    elevation: 3,
  },
  shareCurrentLocationButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  distanceText: {
    fontSize: 16,
    marginBottom: 10,
  },
  directionsButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  directionsButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  clearDirectionsButton: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  clearDirectionsButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  arButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  arButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  favoriteButton: {
    backgroundColor: 'orange',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  favoriteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: 'purple',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  favoriteItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  favoriteItemText: {
    fontSize: 16,
  },
  removeAllButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  removeAllButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 14,
    marginVertical: 5,
  },
  toggleStepsButton: {
    backgroundColor: 'purple',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleStepsButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});