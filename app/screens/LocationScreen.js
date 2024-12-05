import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LocationScreen = () => (
  <View style={styles.container}>
    <Text>This is Location Page</Text>
  </View>
);

// const ProfileScreen = () => (
//   <View style={styles.container}>
//     <Text>This is Profile Page</Text>
//   </View>
// );

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LocationScreen;
