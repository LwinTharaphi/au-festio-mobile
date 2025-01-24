import React, { useState } from 'react';
import { StyleSheet, View, Button } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function LocationScreen({ navigation }) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const markers = [
    { id: 1, name: 'CL Building', latitude: 13.611652749054086, longitude: 100.83792247449529 },
    { id: 2, name: 'VMES', latitude: 13.613098371512264, longitude: 100.8358947560651 },
  ];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 13.611652749054086, // Assumption University coordinates
          longitude: 100.83792247449529,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
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
            onCalloutPress={() => navigation.navigate('ARNavigation', { destination: marker })}
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
});