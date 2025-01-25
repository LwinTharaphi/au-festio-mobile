import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, Dimensions, Alert, Linking, Button } from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import Svg, { Polygon, Line } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function ARNavigationScreen({ route }) {
  const { destination } = route.params;

  const [hasPermission, setHasPermission] = useState(null);
  const [heading, setHeading] = useState(0);
  const [location, setLocation] = useState(null);
  const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });

  // Request permissions
  useEffect(() => {
    (async () => {
      // Request camera permissions
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();

      // Request location permissions
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

      // Check if both permissions are granted
      if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
        console.error('Camera and/or location permissions are required!');
        Alert.alert(
          'Permission Required',
          'This app needs camera and location permissions to function properly.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }

      // Update the permission state
      setHasPermission(cameraStatus === 'granted' && locationStatus === 'granted');
    })();
  }, []);

  // Handle Android magnetometer
  useEffect(() => {
    let subscription;
    if (Platform.OS === 'android') {
      Magnetometer.setUpdateInterval(100);
      subscription = Magnetometer.addListener(setMagnetometerData);
    }
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Calculate heading for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const { x, y } = magnetometerData;
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      angle = (angle + 360) % 360;
      setHeading(angle);
    }
  }, [magnetometerData]);

  // Handle iOS heading
  useEffect(() => {
    let sub;
    if (Platform.OS === 'ios') {
      sub = Location.watchHeadingAsync(({ trueHeading }) => {
        setHeading(trueHeading);
      });
    }
    return () => {
      if (sub && sub.remove) {
        sub.remove();
      }
    };
  }, []);

  // Location tracking
  useEffect(() => {
    let sub;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        Alert.alert(
          'Permission Required',
          'This app needs location permissions to function properly.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      try {
        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 1,
          },
          setLocation
        );
      } catch (error) {
        console.error('Error watching location:', error);
      }
    })();

    return () => {
      if (sub && sub.remove) {
        sub.remove();
      }
    };
  }, []);

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Camera and location permissions are required!</Text>
        <Button
          title="Grant Permissions"
          onPress={() => Linking.openSettings()}
        />
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Acquiring location...</Text>
      </View>
    );
  }

  if (!destination || !destination.latitude || !destination.longitude) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Invalid destination coordinates!</Text>
      </View>
    );
  }

  const bearing = calculateBearing(
    location.coords.latitude,
    location.coords.longitude,
    destination.latitude,
    destination.longitude
  );

  const arrowRotation = bearing - heading;
  const distance = haversineDistance(
    location.coords.latitude,
    location.coords.longitude,
    destination.latitude,
    destination.longitude
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera style={StyleSheet.absoluteFill} />
      
      {/* AR Overlay */}
      <View style={styles.overlay}>
        <Svg style={styles.arrowContainer}>
          {/* Direction arrow */}
          <Polygon
            points="0,-50 40,0 0,50 -40,0"
            fill="rgba(255,0,0,0.8)"
            transform={`rotate(${arrowRotation})`}
          />
          
          {/* Horizon line */}
          <Line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2"
          />
        </Svg>
        
        <View style={styles.infoPanel}>
          <Text style={styles.distanceText}>
            {distance.toFixed(1)} meters to destination
          </Text>
          <Text style={styles.directionText}>
            Bearing: {Math.round(bearing)}° | Heading: {Math.round(heading)}°
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 8,
  },
  distanceText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
  },
  directionText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

// Helper functions
function calculateBearing(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}