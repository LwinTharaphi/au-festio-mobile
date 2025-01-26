import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ARNavigation = ({ destination, onBack }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      let { status: locationStatus } = await Location.requestPermissionsAsync();
      if (locationStatus !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      Location.watchPositionAsync({
        accuracy: Location.Accuracy.High,
        distanceInterval: 1,
      }, (newLocation) => {
        setLocation(newLocation.coords);
      });

      Location.watchHeadingAsync((newHeading) => {
        setHeading(newHeading.trueHeading);
      });
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const calculateBearing = (start, end) => {
    start.lat = parseFloat(start.latitude);
    start.lng = parseFloat(start.longitude);
    end.lat = parseFloat(end.latitude);
    end.lng = parseFloat(end.longitude);

    const dLon = (end.lng - start.lng);
    const y = Math.sin(dLon) * Math.cos(end.lat);
    const x = Math.cos(start.lat) * Math.sin(end.lat) - Math.sin(start.lat) * Math.cos(end.lat) * Math.cos(dLon);
    let brng = Math.atan2(y, x);
    brng = brng * (180 / Math.PI);
    brng = (brng + 360) % 360;
    return brng;
  };

  const bearing = location ? calculateBearing(location, destination) : 0;
  const rotation = (bearing - heading + 360) % 360;

  return (
    <View style={styles.container}>
      {/* AR Camera View */}
      <Camera style={styles.camera} type={Camera.Constants.Type.back}>
        <View style={styles.arrowContainer}>
          <Text style={[styles.arrow, { transform: [{ rotate: `${rotation}deg` }] }]}>{'↑'}</Text>
        </View>
      </Camera>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Back to Map</Text>
      </TouchableOpacity>

      {/* Mini Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location ? location.latitude : 13.611652749054086,
          longitude: location ? location.longitude : 100.83792247449529,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        {location && <Marker coordinate={location} />}
        <Marker coordinate={destination} />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 50,
  },
  arrow: {
    fontSize: 40,
    color: 'white',
  },
  backButton: {
    position: 'absolute',
    bottom: 20, // Positioned at the bottom of the screen
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF', // Solid blue background
    borderRadius: 25, // Rounded corners
    paddingVertical: 10,
    paddingHorizontal: 15,
    zIndex: 1,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  backButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  map: {
    width,
    height: height * 0.3,
  },
});

export default ARNavigation;