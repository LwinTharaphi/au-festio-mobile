import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LocationScreen() {
  return (
    <View style={styles.container}>
      <Text>Location Page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
