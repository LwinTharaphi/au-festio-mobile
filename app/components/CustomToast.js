import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const CustomToast = ({ message, type, visible, duration = 2000 }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timeout = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { opacity: fadeAnim },
        type === 'error' ? styles.errorToast : styles.successToast,
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    padding: 15,
    borderRadius: 5,
    backgroundColor: '#333',
    zIndex: 9999, // Ensure it appears above everything
  },
  successToast: {
    backgroundColor: 'grey',
  },
  errorToast: {
    backgroundColor: 'red',
  },
  toastText: {
    color: 'white',
    fontSize: 16,
  },
});

export default CustomToast;