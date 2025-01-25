import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Button, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function LocationScreen({ navigation }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 13.611652749054086,
    longitude: 100.83792247449529,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [isLoading, setIsLoading] = useState(false);


  const markers = [
    { id: 1, name: 'CL Building', latitude: 13.611652749054086, longitude: 100.83792247449529 },
    { id: 2, name: 'Vincent Mary School of Engineering, Science and Technology (VMES)', latitude: 13.613098371512264, longitude: 100.8358947560651 },
    { id: 3, name: 'Sala Chaturamuk Phaichit', latitude: 13.611730645797293, longitude: 100.83879029400991 },
    { id: 4, name: 'IT Building : Srisakdi Charmonman Building', latitude: 13.61181961688499, longitude: 100.83633391284009 },
    { id: 5, name: 'ABAC Car Park Building', latitude: 13.61184223622187, longitude: 100.83608464745402 },
    { id: 6, name: 'Montfort del Rosario School of Architecture and Design (AR)', latitude: 13.611969897717735, longitude: 100.83554611219331},
    { id: 7, name: 'Albert Laurence School of Communication Arts (CA)', latitude: 13.612205194998582, longitude: 100.83522757952385 },
    { id: 8, name: 'Martin de Tours School of Management and Economics (MSME)', latitude: 13.612698533211569, longitude: 100.83664996645814 },
    { id: 9, name: 'John Paul School of Medicine', latitude: 13.613185049535668, longitude: 100.83540288026663 },
    { id: 10, name: 'Saint Raphael Hall : SR', latitude: 13.611228622968122, longitude: 100.83754561433472 },
    { id: 11, name: 'Communication Arts Studio', latitude: 13.61220045130831, longitude: 100.8348333233367 },
    { id: 12, name: 'Saint Michael Hall', latitude: 13.612329998778712, longitude: 100.83692355988839 },
    { id: 13, name: 'Saint Louis Marie de Montfort Chapel', latitude: 13.612952715673453, longitude: 100.83967118234385 },
    { id: 14, name: 'Saint Gabriel Hall : SG', latitude: 13.61270072537783, longitude: 100.83817710190657 },
    { id: 15, name: 'Crystal Restaurant', latitude: 13.612329128143433, longitude: 100.84076305755255 },
    { id: 16, name: 'John XXIII Conference Center', latitude: 13.61256957761514, longitude: 100.84075050833042 },
    { id: 17, name: 'Martin Rangsan Bridge', latitude: 13.6131876563922, longitude: 100.83384786162004 },
    { id: 18, name: 'Saint Michael Hall', latitude: 13.612329998778712, longitude: 100.83692355988839 },
    { id: 19, name: 'AU Mall', latitude: 13.612499058014974, longitude: 100.83331062101371 },
    { id: 20, name: 'Tennis Court', latitude: 13.61228991820125, longitude: 100.83276025955544 },
    { id: 21, name: 'Football Field', latitude: 13.612613011901082, longitude: 100.83168632970738 },
    { id: 22, name: 'King Solomon Residence Hall', latitude: 13.613021331961226, longitude: 100.83220616585912 },
    { id: 23, name: 'Queen of Sheba Residence Hall', latitude: 13.614029016865167, longitude: 100.83240207320488 },
    { id: 24, name: 'King David Residence Hall', latitude: 13.613912642493766, longitude: 100.83157887035868 },
    { id: 25, name: 'AU Museum Clock Tower', latitude: 13.613268043332756, longitude: 100.83302168622195 },
    { id: 26, name: 'Basketball Court', latitude: 13.61368165533807, longitude: 100.83229937262368 },
    { id: 27, name: 'AU Aquatic Center', latitude: 13.614683546609388, longitude: 100.83340685242848 },
    { id: 28, name: 'Indoor Swimming Pool', latitude: 13.615262338221441, longitude: 100.83308073092745 },
    { id: 39, name: 'AU Swimming Pool', latitude: 13.615694529559711, longitude: 100.83301355509825 },
    { id: 30, name: 'John Paul II Sports Center', latitude: 13.615554446216818, longitude: 100.83355005376762 },
    { id: 31, name: 'Indoor Tennis Court', latitude: 13.616033063962563, longitude: 100.83394642218752 },
    { id: 32, name: 'Outdoor Parking Lot', latitude: 13.615317913000434, longitude: 100.83485431364852 },
  ];


   // Fetch user's current location
   useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setInitialRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    })();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.name}
            onCalloutPress={() => {
              if (marker.latitude && marker.longitude) {
                navigation.navigate('ARNavigation', { destination: marker });
              } else {
                console.error('Invalid marker coordinates:', marker);
              }
            }}
          />
        ))}
      </MapView>
      {selectedLocation && (
        <Button
          title="Navigate in AR"
          onPress={() => navigation.navigate('ARNavigation', { destination: selectedLocation })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});