import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StaffsScreen({ route }) {
  const { eventId } = route.params;

  return (
    <View style={styles.container}>
      <Text>Staffs for Event ID: {eventId}</Text>
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
