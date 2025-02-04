import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as Sensors from 'expo-sensors';
import { getGreatCircleBearing, getDistance } from 'geolib';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT / 2;
const ARRIVAL_THRESHOLD = 15; // Meters

const ARNavigation = ({ destination, onBack }) => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [distance, setDistance] = useState(0);
  const rotateAnim = useState(new Animated.Value(0))[0];
  const [sound, setSound] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);

  // Load sound effect
  async function loadSound() {
    const { sound } = await Audio.Sound.createAsync(
      require('/Users/thaemyatnoehtut/au-festio-mobile/assets/sound/navigation_beep.mp3')
    );
    setSound(sound);
  }

  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation },
        (loc) => {
          const newDistance = getDistance(loc.coords, destination);
          setLocation(loc.coords);
          setDistance(newDistance);
          
          if (newDistance <= ARRIVAL_THRESHOLD && !hasArrived) {
            setHasArrived(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (sound) {
              sound.replayAsync();
            }
          } else if (newDistance > ARRIVAL_THRESHOLD && hasArrived) {
            setHasArrived(false);
          }
        }
      );

      Sensors.Magnetometer.addListener((data) => {
        // Adjust for device orientation (landscape vs portrait)
        const { x, y } = data;
        let newHeading = Math.atan2(y, x) * (180 / Math.PI);
        newHeading = (newHeading + 360) % 360;
        setHeading(newHeading);
      });

      if (__DEV__) {
        Location.setMockLocationAsync({
          latitude: destination.latitude,
          longitude: destination.longitude,
        });
      }
    })();

    return () => {
      Sensors.Magnetometer.removeAllListeners();
    };
  }, [destination]);

  useEffect(() => {
    if (location && heading !== null && destination) {
      const bearing = getGreatCircleBearing(
        { latitude: location.latitude, longitude: location.longitude },
        destination
      );
      
      // Calculate relative angle with proper offset
      const relativeAngle = (bearing - heading + 360) % 360;
      
      // Adjust arrow rotation with device orientation compensation
      Animated.spring(rotateAnim, {
        toValue: -relativeAngle, // Negative value for correct rotation direction
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  }, [location, heading, destination]);

  const getArrowColor = () => {
    if (hasArrived) return '#00FF00';
    if (distance < 50) return '#FFA500';
    return '#FF0000';
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Compass Ring */}
        <Svg height="300" width="300" style={styles.compass}>
          <Circle
            cx="150"
            cy="150"
            r="140"
            stroke="white"
            strokeWidth="2"
            fill="transparent"
          />
        </Svg>

        {/* Navigation Arrow */}
        <Animated.View style={[styles.arrowContainer, {
          transform: [
            { rotate: rotateAnim.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg']
            })}
          ]
        }]}>
          <Svg height="100" width="100">
            <Path
              d="M50 5 L100 100 L50 70 L0 100 Z"
              fill={getArrowColor()}
              transform={`rotate(180 50 50)`} // Correct arrow direction
            />
          </Svg>
        </Animated.View>

        {/* Distance Information */}
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceText}>
            {hasArrived ? `Arrived at ` : `${Math.round(distance)}m to `}
            {destination?.name}
          </Text>
          {hasArrived && (
            <Text style={styles.successText}>
              🎉 You're here!
            </Text>
          )}
        </View>

        {/* Path Visualization */}
        {!hasArrived && (
          <Svg style={styles.pathVisualization}>
            <Path
              d={`M${CENTER_X} ${SCREEN_HEIGHT} L${CENTER_X} ${CENTER_Y}`}
              stroke="white"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </Svg>
        )}
      </CameraView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  compass: {
    position: 'absolute',
    top: CENTER_Y - 150,
    left: CENTER_X - 150,
    opacity: 0.5,
  },
  arrowContainer: {
    position: 'absolute',
    top: CENTER_Y - 50,
    left: CENTER_X - 50,
  },
  distanceContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  distanceText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  directionText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  pathVisualization: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  successText: {
    color: '#00FF00',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  distanceText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ARNavigation;