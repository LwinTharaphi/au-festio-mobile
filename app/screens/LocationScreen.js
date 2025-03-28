import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import ARNavigation from './ARNavigation';

const { width, height } = Dimensions.get('window');

// Predefined markers array for locations.
const markers = [
  { id: 1, name: 'CL Building', latitude: 13.611652749054086, longitude: 100.83792247449529 },
  { id: 2, name: 'Vincent Mary School of Engineering, Science and Technology (VMES)', latitude: 13.613098371512264, longitude: 100.8358947560651 },
  { id: 3, name: 'Sala Chaturamuk Phaichit', latitude: 13.611730645797293, longitude: 100.83879029400991 },
  { id: 4, name: 'IT Building : Srisakdi Charmonman Building', latitude: 13.61181961688499, longitude: 100.83633391284009 },
  { id: 5, name: 'ABAC Car Park Building', latitude: 13.61184223622187, longitude: 100.83608464745402 },
  { id: 6, name: 'Montfort del Rosario School of Architecture and Design (AR)', latitude: 13.611969897717735, longitude: 100.83554611219331},
  { id: 7, name: 'Albert Laurence School of Communication Arts (CA)', latitude: 13.612205194998582, longitude: 100.83522757952385 },
  { id: 8, name: 'Martin de Tours School of Management and Economics (MSME)', latitude: 13.612698533211569, longitude: 100.83664996645814 },
  { id: 9, name: 'Saint Luke School of Medicine', latitude: 13.61322163108002, longitude: 100.83549263423588 },
  { id: 10, name: 'SR Building', latitude: 13.611228622968122, longitude: 100.83754561433472 },
  { id: 11, name: 'Communication Arts Studio', latitude: 13.61220045130831, longitude: 100.8348333233367 },
  { id: 12, name: 'Saint Michael Hall', latitude: 13.612329998778712, longitude: 100.83692355988839 },
  { id: 13, name: 'Saint Louis Marie de Montfort Chapel', latitude: 13.612952715673453, longitude: 100.83967118234385 },
  { id: 14, name: 'Saint Gabriel Hall : SG', latitude: 13.61270072537783, longitude: 100.83817710190657 },
  { id: 15, name: 'Saint Raphael Hall : SR', latitude: 13.611268698268358, longitude: 100.83764868097137 },
  { id: 16, name: 'Crystal Restaurant', latitude: 13.612329128143433, longitude: 100.84076305755255 },
  { id: 17, name: 'John XXIII Conference Center', latitude: 13.61256957761514, longitude: 100.84075050833042 },
  { id: 18, name: 'Martin Rangsan Bridge', latitude: 13.6131876563922, longitude: 100.83384786162004 },
  { id: 19, name: 'Saint Michael Hall', latitude: 13.612329998778712, longitude: 100.83692355988839 },
  { id: 20, name: 'AU Mall', latitude: 13.612499058014974, longitude: 100.83331062101371 },
  { id: 21, name: 'Tennis Court', latitude: 13.61228991820125, longitude: 100.83276025955544 },
  { id: 22, name: 'Football Field', latitude: 13.612613011901082, longitude: 100.83168632970738 },
  { id: 23, name: 'King Solomon Residence Hall', latitude: 13.613021331961226, longitude: 100.83220616585912 },
  { id: 24, name: 'Queen of Sheba Residence Hall', latitude: 13.614029016865167, longitude: 100.83240207320488 },
  { id: 25, name: 'King David Residence Hall', latitude: 13.613912642493766, longitude: 100.83157887035868 },
  { id: 26, name: 'AU Museum Clock Tower', latitude: 13.613268043332756, longitude: 100.83302168622195 },
  { id: 27, name: 'Basketball Court', latitude: 13.61368165533807, longitude: 100.83229937262368 },
  { id: 28, name: 'AU Aquatic Center', latitude: 13.614683546609388, longitude: 100.83340685242848 },
  { id: 29, name: 'Indoor Swimming Pool', latitude: 13.615262338221441, longitude: 100.83308073092745 },
  { id: 30, name: 'AU Swimming Pool', latitude: 13.615694529559711, longitude: 100.83301355509825 },
  { id: 31, name: 'John Paul II Sports Center', latitude: 13.615554446216818, longitude: 100.83355005376762 },
  { id: 32, name: 'Indoor Tennis Court', latitude: 13.616033063962563, longitude: 100.83394642218752 },
  { id: 33, name: 'Outdoor Parking Lot', latitude: 13.615317913000434, longitude: 100.83485431364852 },
  {id: 34, name: 'Graduate Studies', latitude: 13.613037513820242, longitude: 100.83624555959206},
  {id: 35, name: 'AU Fountain', latitude: 13.612948580254617, longitude: 100.83562631510614}
];

// Helper function to calculate the distance between two geographic coordinates.
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters.
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Returns distance in meters.
};

export default function LocationScreen() {
  // State variables for location, markers, directions, modals, etc.
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

  // Reference to the MapView.
  const mapRef = useRef(null);

  // Memoize selected marker for ARNavigation.
  const memoizedSelectedMarker = useMemo(() => selectedMarker, [selectedMarker]);

  // Define favoriteMarkers using the favorites state.
  const favoriteMarkers = markers.filter((marker) =>
    favorites.includes(marker.id)
  );

  // Load favorites from AsyncStorage when the component mounts.
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

  // Save favorites to AsyncStorage when favorites change.
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

  // Request location permission and get current position.
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoading(false);
        Alert.alert(
          'Location Permission Denied',
          'Please enable location permissions in settings to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setIsLoading(false);
    })();
  }, []);

  // Handle deep linking.
  useEffect(() => {
    const handleDeepLink = (event) => {
      const { url } = event;
      const parsedUrl = Linking.parse(url);
      const { queryParams } = parsedUrl;
      if (queryParams && queryParams.latitude && queryParams.longitude) {
        const sharedLocation = {
          latitude: parseFloat(queryParams.latitude),
          longitude: parseFloat(queryParams.longitude),
        };
        setSelectedMarker({
          name: 'Shared Location',
          latitude: sharedLocation.latitude,
          longitude: sharedLocation.longitude,
        });
        setShowDetails(true);
      }
    };
    Linking.addEventListener('url', handleDeepLink);
    return () => {
      Linking.removeEventListener('url', handleDeepLink);
    };
  }, []);

  // Handle search changes.
  const handleSearch = (query) => setSearchQuery(query);

  // Filter markers based on search query.
  const filteredMarkers = markers.filter((marker) =>
    marker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // When a marker is pressed.
  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    setShowDetails(true);
    Keyboard.dismiss();
  };

  // Fetch route directions.
  const fetchRoute = async (start, end) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((coord) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setDirections(coords);
        const steps = data.routes[0].legs[0].steps.map((step) => step.maneuver.instruction);
        setSteps(steps);
      } else {
        console.error('No route found');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  // Calculate directions.
  const calculateDirections = () => {
    if (location && selectedMarker) {
      const start = { latitude: location.latitude, longitude: location.longitude };
      const end = { latitude: selectedMarker.latitude, longitude: selectedMarker.longitude };
      fetchRoute(start, end);
    }
  };

  // Clear directions.
  const clearDirections = () => {
    setDirections([]);
    setSteps([]);
    setShowSteps(false);
  };

  // Toggle favorite status.
  const toggleFavorite = (marker) => {
    if (favorites.includes(marker.id)) {
      setFavorites(favorites.filter((id) => id !== marker.id));
    } else {
      setFavorites([...favorites, marker.id]);
    }
  };

  // Open AR Navigation.
  const handleARNavigation = () => {
    setShowARNavigation(true);
    setShowDetails(false);
    Keyboard.dismiss();
  };

  // Show favorites modal.
  const handleShowFavorites = () => {
    setShowFavorites(true);
    Keyboard.dismiss();
  };

  // Close favorites modal.
  const handleCloseFavorites = () => {
    setShowFavorites(false);
  };

  // Remove all favorites.
  const removeAllFavorites = () => {
    setFavorites([]);
  };

  // If there's an error, display it.
  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  // Show a loading indicator while location is fetched.
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Render AR Navigation if active.
  if (showARNavigation && selectedMarker) {
    return (
      <ARNavigation
        destination={memoizedSelectedMarker}
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

      {/* Grouped Button Container (Favorites and My Location only) */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.groupButton} onPress={handleShowFavorites}>
          <Ionicons name="heart" size={24} color="red" />
          <Text style={styles.groupButtonText}>View Favorites</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.groupButton}
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
          <Text style={styles.groupButtonText}>My Location</Text>
        </TouchableOpacity>
      </View>

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
              disabled={!selectedMarker}
            >
              <Ionicons name="camera" size={20} color="white" />
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

// Styles.
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
  buttonGroup: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
  },
  groupButton: {
    flex: 1,
    alignItems: 'center',
  },
  groupButtonText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    flexDirection: 'row',
    justifyContent: 'center',
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