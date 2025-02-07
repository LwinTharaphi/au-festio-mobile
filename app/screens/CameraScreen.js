// Import necessary modules from React, Expo, and Three.js
import React, { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Import the new CameraView and useCameraPermissions from expo-camera
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Renderer } from 'expo-three';

export default function App() {
  // Use state for camera facing: use simple strings 'back' or 'front'
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();

  // Wait for permission status to load
  if (!permission) {
    return <View />;
  }

  // If permission is not granted, prompt the user
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  // Function to toggle camera facing direction
  function toggleCameraFacing() {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }

  // onContextCreate for GLView: sets up a basic Three.js scene (a rotating cube)
  const onContextCreate = async (gl) => {
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.z = 2;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
      gl.endFrameEXP(); // Signal that the frame is complete
    };
    animate();
  };

  return (
    <View style={styles.container}>
      {/* Render the camera preview using the new CameraView.
          Note: Do not nest any children here! */}
      <CameraView style={styles.camera} facing={facing} />
      {/* Render the GLView as an overlay for AR effects */}
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
      {/* Render overlay controls in a separate absolutely positioned container */}
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative', // Ensures that absolute positioning works for overlays
  },
  camera: {
    flex: 1,
  },
  glView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(52,52,52,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
});