import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BoothsScreen = () => (
  <View style={styles.container}>
    <Text>This is Booths Page</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BoothsScreen;
