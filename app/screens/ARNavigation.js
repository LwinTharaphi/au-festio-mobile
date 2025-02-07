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
import MapView, { Marker } from 'react-native-maps';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT / 2;
const ARRIVAL_THRESHOLD = 15; // Meters

const markers = [
  { id: 1, name: 'CL Building', latitude: 13.611652749054086, longitude: 100.83792247449529 },
  { id: 2, name: 'Vincent Mary School of Engineering, Science and Technology (VMES)', latitude: 13.613098371512264, longitude: 100.8358947560651 },
  { id: 3, name: 'Sala Chaturamuk Phaichit', latitude: 13.611730645797293, longitude: 100.83879029400991 },
  { id: 4, name: 'IT Building : Srisakdi Charmonman Building', latitude: 13.61181961688499, longitude: 100.83633391284009 },
  { id: 5, name: 'ABAC Car Park Building', latitude: 13.61184223622187, longitude: 100.83608464745402 },
  { id: 6, name: 'Montfort del Rosario School of Architecture and Design (AR)', latitude: 13.611969897717735, longitude: 100.83554611219331},
  { id: 7, name: 'Albert Laurence School of Communication Arts (CA)', latitude: 13.612205194998582, longitude: 100.83522757952385 },
  { id: 8, name: 'Martin de Tours School of Management and Economics (MSME)', latitude: 13.612698533211569, longitude: 100.83664996645814 },
  { id: 9, name: 'Saint Luke School of Medicine', latitude: 13.613185049535668, longitude: 100.83540288026663 },
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
  { id: 34, name: 'Graduate Studies', latitude: 13.612840208801865, longitude: 100.83623324263411 },
];

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
      require('../../assets/sound/navigation_beep.mp3')
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

        {/* Mini Radar Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location ? location.latitude : destination.latitude,
              longitude: location ? location.longitude : destination.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            zoomEnabled={false}
            scrollEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                title={marker.name}
              />
            ))}
            {location && (
              <Marker
                coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                title="Your Location"
                pinColor="blue"
              />
            )}
          </MapView>
        </View>
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
  mapContainer: {
    position: 'absolute',
    bottom: 500,
    right: 8,
    width: 210,
    height: 170,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default ARNavigation;