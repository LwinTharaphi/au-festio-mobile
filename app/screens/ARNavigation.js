import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { getGreatCircleBearing, getDistance } from 'geolib';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import MapView, { Marker } from 'react-native-maps';
import throttle from 'lodash.throttle';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT / 2;
const ARRIVAL_THRESHOLD = 15;
const RADAR_SIZE = 180;
const RADAR_RADIUS = RADAR_SIZE / 2;
const RADAR_MAX_DISTANCE = 200;
const POI_LIMIT = 5;

// Constant markers list
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
  {id: 34, name: 'Graduate Studies', latitude: 13.612840208801865, longitude: 100.83623324263411},
  {id: 35, name: 'AU Fountain', latitude: 13.612954512540377, longitude: 100.8356260006042}
];

const ARNavigation = ({ destination, onBack }) => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [distance, setDistance] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [nearbyPOIs, setNearbyPOIs] = useState([]);
  const [radarPOIs, setRadarPOIs] = useState([]);
  const [showRadar, setShowRadar] = useState(true);
  const mockLocationSetRef = useRef(false);

  // Calculate destination data based on current location
  const destinationData = useMemo(() => ({
    exists: !!destination,
    distance: location ? getDistance(location, destination) : 0,
    bearing: location ? getGreatCircleBearing(location, destination) : 0,
  }), [location, destination]);

  // Load navigation sound on mount
  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sound/navigation_beep.mp3')
      );
      soundRef.current = sound;
    };
    loadSound();
    return () => soundRef.current?.unloadAsync();
  }, []);

  // Update nearby POIs for the radar view
  const updateNearbyPOIs = useCallback((currentLocation) => {
    const calculatedPOIs = markers
      .filter(m => m.id !== destination?.id)
      .map(m => ({
        ...m,
        distance: getDistance(currentLocation, m),
        bearing: getGreatCircleBearing(currentLocation, m),
      }))
      .filter(poi => poi.distance <= RADAR_MAX_DISTANCE)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, POI_LIMIT);
    setNearbyPOIs(calculatedPOIs);
  }, [destination]);

  // Throttled location update – update at most every 500ms
  const throttledHandleLocationUpdate = useCallback(
    throttle((loc) => {
      // Skip update if location change is insignificant
      if (location && getDistance(location, loc.coords) < 1) return;
      const newDistance = getDistance(loc.coords, destination);
      setLocation(loc.coords);
      setDistance(newDistance);

      // Trigger arrival feedback if within threshold
      if (newDistance <= ARRIVAL_THRESHOLD) {
        if (!hasArrived) {
          setHasArrived(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          soundRef.current?.replayAsync();
        }
      } else if (hasArrived) {
        setHasArrived(false);
      }
      updateNearbyPOIs(loc.coords);
    }, 500),
    [destination, updateNearbyPOIs, location, hasArrived]
  );

  // Subscribe to both location and heading updates using Expo Location
  useEffect(() => {
    let locationSub;
    let headingSub;
    
    (async () => {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      // Subscribe to position updates
      locationSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 500, distanceInterval: 1 },
        throttledHandleLocationUpdate
      );
      
      // Subscribe to heading updates from location (works on both iOS and Android)
      headingSub = await Location.watchHeadingAsync((headingData) => {
        // Use trueHeading if available; otherwise, fallback to heading
        const newHeading = headingData.trueHeading != null ? headingData.trueHeading : headingData.heading;
        setHeading(newHeading);
      });

      // For testing in development mode, set a mock location if needed
      if (__DEV__ && destination && !mockLocationSetRef.current) {
        mockLocationSetRef.current = true;
        Location.setMockLocationAsync(destination);
      }
    })();

    return () => {
      locationSub?.remove();
      headingSub?.remove();
    };
  }, [destination, throttledHandleLocationUpdate]);

  // Update radar POIs positions when nearby POIs or heading changes
  useEffect(() => {
    const newRadarPOIs = nearbyPOIs.map(poi => {
      // Calculate the angle relative to current heading
      const angle = (poi.bearing - heading + 360) % 360;
      // Adjust by 90° for SVG coordinate system and convert to radians
      const angleRad = (angle - 90) * (Math.PI / 180);
      const ratio = poi.distance / RADAR_MAX_DISTANCE;
      return {
        ...poi,
        x: RADAR_RADIUS + (ratio * RADAR_RADIUS * Math.cos(angleRad)),
        y: RADAR_RADIUS + (ratio * RADAR_RADIUS * Math.sin(angleRad))
      };
    });
    setRadarPOIs(newRadarPOIs);
  }, [nearbyPOIs, heading]);

  // Animate the AR arrow rotation when location, heading, or destination changes
  useEffect(() => {
    if (location && heading !== null && destination) {
      // Get bearing from current location to destination
      const bearing = getGreatCircleBearing(location, destination);
      // Compute a signed relative angle between -180° and 180°
      const signedRelativeAngle = ((bearing - heading + 540) % 360) - 180;
      // Animate the arrow rotation using the computed angle
      Animated.spring(rotateAnim, {
        toValue: signedRelativeAngle,
        useNativeDriver: true,
        friction: 8,
        tension: 60,
      }).start();
    }
  }, [location, heading, destination, rotateAnim]);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission required for AR navigation</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render the radar view overlay
  const renderRadar = () => (
    <Svg height={RADAR_SIZE} width={RADAR_SIZE} style={styles.radar}>
      <Circle cx={RADAR_RADIUS} cy={RADAR_RADIUS} r={RADAR_RADIUS} fill="rgba(0,0,0,0.3)" />
      <G stroke="rgba(255,255,255,0.2)" strokeWidth="1">
        {[0.25, 0.5, 0.75].map(r => (
          <Circle key={r} cx={RADAR_RADIUS} cy={RADAR_RADIUS} r={RADAR_RADIUS * r} fill="none" />
        ))}
      </G>
      {radarPOIs.map(poi => (
        <G key={poi.id} x={poi.x} y={poi.y}>
          <Circle r="4" fill="#FF6B6B" stroke="#FFF" strokeWidth="1" />
          <SvgText
            x="0"
            y="-8"
            fill="white"
            fontSize="10"
            textAnchor="middle"
            fontWeight="bold"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="1"
          >
            {poi.name.split(' ')[0]}
          </SvgText>
        </G>
      ))}
      <Circle cx={RADAR_RADIUS} cy={RADAR_RADIUS} r="5" fill="#4D96FF" />
      {destinationData.exists && destinationData.distance <= RADAR_MAX_DISTANCE && (
        (() => {
          const angle = (destinationData.bearing - heading + 360) % 360;
          const angleRad = (angle - 90) * (Math.PI / 180);
          const ratio = destinationData.distance / RADAR_MAX_DISTANCE;
          return (
            <G
              x={RADAR_RADIUS + (ratio * RADAR_RADIUS * Math.cos(angleRad))}
              y={RADAR_RADIUS + (ratio * RADAR_RADIUS * Math.sin(angleRad))}
            >
              <Circle r="6" fill="#00FF00" stroke="#FFF" strokeWidth="1.5" />
              <SvgText
                x="0"
                y="-10"
                fill="#00FF00"
                fontSize="10"
                textAnchor="middle"
                fontWeight="bold"
              >
                {destination.name.split(' ')[0]}
              </SvgText>
            </G>
          );
        })()
      )}
    </Svg>
  );

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.arrowContainer,
            {
              transform: [
                {
                  // Interpolate rotation to degrees
                  rotate: rotateAnim.interpolate({
                    inputRange: [-180, 180],
                    outputRange: ['-180deg', '180deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg height="120" width="120">
            <Path
              d="M60 10 L110 110 L60 80 L10 110 Z"
              fill={hasArrived ? '#00FF00' : distance < 50 ? '#FFA500' : '#FF5555'}
              opacity={0.9}
              stroke="white"
              strokeWidth="2"
            />
          </Svg>
        </Animated.View>
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceText}>
            {hasArrived
              ? `🎉 Arrived at ${destination.name}`
              : `${Math.round(distance)}m to ${destination.name}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.radarToggle}
          onPress={() => setShowRadar(!showRadar)}
        >
          <Ionicons name={showRadar ? 'eye-off' : 'eye'} size={24} color="white" />
        </TouchableOpacity>
        {showRadar && (
          <View style={styles.radarContainer}>
            {renderRadar()}
          </View>
        )}
        {!hasArrived && (
          <Svg style={StyleSheet.absoluteFill}>
            <Path
              d={`M${CENTER_X} ${SCREEN_HEIGHT} L${CENTER_X} ${CENTER_Y}`}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2"
              strokeDasharray="8 5"
            />
          </Svg>
        )}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location ? location.latitude : destination.latitude,
              longitude: location ? location.longitude : destination.longitude,
              latitudeDelta: 0.002,
              longitudeDelta: 0.002,
            }}
            zoomEnabled={false}
            scrollEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            loadingEnabled={true}
            loadingIndicatorColor="#666666"
            loadingBackgroundColor="#eeeeee"
          >
            {location && (
              <Marker
                coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                title="Your Location"
                pinColor="blue"
              >
                <View style={styles.userMarker}>
                  <View style={styles.userMarkerInner} />
                </View>
              </Marker>
            )}
            {destination && (
              <Marker
                coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
                title={destination.name}
                pinColor="green"
              >
                <View style={styles.destinationMarker}>
                  <Ionicons name="flag" size={20} color="white" />
                </View>
              </Marker>
            )}
            {nearbyPOIs.map(poi => (
              <Marker
                key={poi.id}
                coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
                title={poi.name}
                description={`${Math.round(poi.distance)}m away`}
              >
                <View style={styles.poiMarker}>
                  <Text style={styles.poiText}>{poi.name.split(' ')[0]}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1 },
  backButton: { position: 'absolute', top: 40, left: 20, zIndex: 1 },
  radarContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    width: RADAR_SIZE,
    height: RADAR_SIZE + 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    zIndex: 1,
  },
  arrowContainer: { position: 'absolute', top: CENTER_Y - 50, left: CENTER_X - 50 },
  distanceContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  distanceText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  mapContainer: {
    position: 'absolute',
    bottom: 420,
    right: 0,
    width: 198,
    height: 180,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: { ...StyleSheet.absoluteFillObject },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
  destinationMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  poiMarker: {
    backgroundColor: '#FF6B6B',
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'white',
  },
  poiText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  permissionText: { color: 'white', fontSize: 18, marginBottom: 10 },
  permissionButton: { backgroundColor: '#4CAF50', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5 },
  permissionButtonText: { color: 'white', fontSize: 16 },
  radarToggle: { position: 'absolute', top: 40, right: 20, zIndex: 1 },
  radar: { position: 'absolute', top: 0, left: 0 },
});

export default ARNavigation;
