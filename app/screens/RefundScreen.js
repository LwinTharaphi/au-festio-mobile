import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RefundScreen = ({ route }) => {
  // Get the refund percentage from route parameters
  const { refundPercentage } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>You are eligible for a {refundPercentage}% refund.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa', // Light background for better readability
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40', // Dark text color
  },
});

export default RefundScreen;
