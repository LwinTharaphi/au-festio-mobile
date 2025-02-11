// Import necessary modules and hooks
import React, { useState, useRef } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView
} from 'react-native';
import Slider from '@react-native-community/slider';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  // Existing state variables
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [gallery, setGallery] = useState([]);
  const [timerDelay, setTimerDelay] = useState(0); // Delay in seconds: 0, 3, or 5
  const [gridVisible, setGridVisible] = useState(false);

  // New control states
  const [zoom, setZoom] = useState(0); // Zoom value 0-1
  const [hdr, setHdr] = useState(false);
  const [filter, setFilter] = useState('none'); // Filters: none, sepia, grayscale, cool, warm, vintage
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [focus, setFocus] = useState(0); // Manual focus (0-1)
  const [exposure, setExposure] = useState(0); // Exposure control (range -1 to 1)
  const [ratio, setRatio] = useState('4:3'); // Aspect ratio: "4:3" or "16:9"

  // New state for self-timer countdown display
  const [countdown, setCountdown] = useState(null);

  // Reference to the camera
  const cameraRef = useRef(null);

  // Wait for permission
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Toggle functions
  function toggleTimer() {
    setTimerDelay(current => (current === 0 ? 3 : current === 3 ? 5 : 0));
  }
  function toggleGrid() {
    setGridVisible(prev => !prev);
  }
  function toggleHDR() {
    setHdr(prev => !prev);
  }
  function toggleFilter() {
    const filters = ['none', 'sepia', 'grayscale', 'cool', 'warm', 'vintage'];
    let currentIndex = filters.indexOf(filter);
    let nextIndex = (currentIndex + 1) % filters.length;
    setFilter(filters[nextIndex]);
  }
  function toggleRatio() {
    setRatio(prev => (prev === '4:3' ? '16:9' : '4:3'));
  }
  function toggleGalleryVisible() {
    setGalleryVisible(prev => !prev);
  }
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }
  function resetSettings() {
    setZoom(0);
    setFocus(0);
    setExposure(0);
    setTimerDelay(0);
    setGridVisible(false);
    setHdr(false);
    setFilter('none');
    setRatio('4:3');
  }

  // Function to save a photo into the device using expo-media-library
  async function savePhoto(uri) {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Photo Saved', 'The photo has been saved to your device.');
      } else {
        Alert.alert('Permission Denied', 'Media library permission is required to save photos.');
      }
    } catch (error) {
      console.error('Error saving photo:', error);
    }
  }

  // Capture photo with optional timer using a visible countdown overlay.
  async function capturePhoto() {
    if (cameraRef.current) {
      if (timerDelay > 0) {
        // Start countdown
        setCountdown(timerDelay);
        const intervalId = setInterval(() => {
          setCountdown(prev => {
            if (prev === 1) {
              clearInterval(intervalId);
              setCountdown(null);
              cameraRef.current.takePictureAsync()
                .then(capturedPhoto => {
                  setGallery(prevGallery => [...prevGallery, capturedPhoto.uri]);
                  Alert.alert('Photo Captured', 'Your photo was captured successfully!');
                })
                .catch(error => console.error('Error capturing photo:', error));
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        try {
          const capturedPhoto = await cameraRef.current.takePictureAsync();
          setGallery(prevGallery => [...prevGallery, capturedPhoto.uri]);
          Alert.alert('Photo Captured', 'Your photo was captured successfully!');
        } catch (error) {
          console.error('Error capturing photo:', error);
        }
      }
    }
  }

  // Burst mode: capture 5 photos in quick succession and add them to the gallery.
  async function burstCapture() {
    if (cameraRef.current) {
      const burstPhotos = [];
      for (let i = 0; i < 5; i++) {
        try {
          const capturedPhoto = await cameraRef.current.takePictureAsync();
          burstPhotos.push(capturedPhoto.uri);
        } catch (error) {
          console.error('Error capturing burst photo:', error);
        }
        // Wait 300ms between shots
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      setGallery(prevGallery => [...prevGallery, ...burstPhotos]);
      Alert.alert('Burst Mode', 'Burst photos captured successfully!');
    }
  }

  return (
    <View style={styles.container}>
      {/* CameraView with additional props */}
      <CameraView
        style={styles.camera}
        facing={facing}
        zoom={zoom}
        hdr={hdr}
        focusDepth={focus}
        exposure={exposure}
        ratio={ratio}
        ref={cameraRef}
      >
        {gridVisible && (
          <View style={styles.gridOverlay}>
            <View style={[styles.gridLineVertical, { left: '33%' }]} />
            <View style={[styles.gridLineVertical, { left: '66%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '33%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '66%' }]} />
          </View>
        )}
        {/* Filter overlay */}
        {filter !== 'none' && (
          <View
            style={[
              styles.filterOverlay,
              filter === 'sepia'
                ? styles.filterSepia
                : filter === 'grayscale'
                ? styles.filterGrayscale
                : filter === 'cool'
                ? styles.filterCool
                : filter === 'warm'
                ? styles.filterWarm
                : filter === 'vintage'
                ? styles.filterVintage
                : {},
            ]}
          />
        )}
        {/* Countdown overlay */}
        {countdown !== null && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
      </CameraView>

      {/* Right vertical control panel for sliders */}
      <View style={styles.controlPanel}>
        <Text style={styles.controlLabel}>Zoom</Text>
        <Slider
          style={styles.controlSlider}
          minimumValue={0}
          maximumValue={1}
          value={zoom}
          onValueChange={setZoom}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#000000"
        />
        <Text style={styles.controlLabel}>Focus</Text>
        <Slider
          style={styles.controlSlider}
          minimumValue={0}
          maximumValue={1}
          value={focus}
          onValueChange={setFocus}
          minimumTrackTintColor="#FFDD00"
          maximumTrackTintColor="#000000"
        />
        <Text style={styles.controlLabel}>Exposure</Text>
        <Slider
          style={styles.controlSlider}
          minimumValue={-1}
          maximumValue={1}
          value={exposure}
          onValueChange={setExposure}
          minimumTrackTintColor="#FF0000"
          maximumTrackTintColor="#0000FF"
        />
      </View>

      {/* Top horizontal scroll view for toggles */}
      <View style={styles.topToggles}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity onPress={toggleTimer} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>
              Timer: {timerDelay === 0 ? 'Off' : timerDelay + 's'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleGrid} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>
              Grid: {gridVisible ? 'On' : 'Off'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleHDR} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>HDR: {hdr ? 'On' : 'Off'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFilter} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>Filter: {filter}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleRatio} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>Ratio: {ratio}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleGalleryVisible} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>
              Gallery: {galleryVisible ? 'On' : 'Off'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetSettings} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>Reset</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom container for capture, burst, and flip buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.burstButton} onPress={burstCapture}>
          <Text style={styles.burstButtonText}>Burst</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomButton} onPress={toggleCameraFacing}>
          <Text style={styles.bottomButtonText}>Flip</Text>
        </TouchableOpacity>
      </View>

      {/* Gallery display - each image is tappable to save it to device */}
      {galleryVisible && (
        <View style={styles.galleryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {gallery.map((uri, index) => (
              <TouchableOpacity key={index} onPress={() => savePhoto(uri)}>
                <Image source={{ uri }} style={styles.galleryImage} />
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  message: { textAlign: 'center', paddingBottom: 10, fontSize: 16 },
  permissionButton: { backgroundColor: '#00000080', padding: 10, borderRadius: 5, alignSelf: 'center' },
  permissionButtonText: { color: 'white', fontSize: 16 },
  camera: { flex: 1 },
  /* Right vertical control panel */
  controlPanel: {
    position: 'absolute',
    right: 10,
    top: 80,
    width: 100,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    padding: 5,
    alignItems: 'center',
  },
  controlSlider: { width: 80, height: 40 },
  controlLabel: { color: 'white', fontSize: 10, marginVertical: 2 },
  /* Top toggles */
  topToggles: { position: 'absolute', top: 20, left: 0, right: 0 },
  toggleButton: {
    backgroundColor: '#00000080',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  toggleButtonText: { color: 'white', fontSize: 10 },
  /* Bottom controls */
  bottomContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00000080',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  bottomButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#ddd',
  },
  captureButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#808080' },
  burstButton: { marginLeft: 20, padding: 8, backgroundColor: '#FFAA00', borderRadius: 5 },
  burstButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  gridOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  gridLineVertical: { position: 'absolute', width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.5)' },
  gridLineHorizontal: { position: 'absolute', height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.5)' },
  filterOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  filterSepia: { backgroundColor: 'rgba(112,66,20,0.3)' },
  filterGrayscale: { backgroundColor: 'rgba(128,128,128,0.3)' },
  filterCool: { backgroundColor: 'rgba(0,50,100,0.3)' },
  filterWarm: { backgroundColor: 'rgba(255,153,51,0.3)' },
  filterVintage: { backgroundColor: 'rgba(150,100,70,0.3)' },
  /* Countdown overlay */
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  countdownText: {
    fontSize: 60,
    color: 'white',
    fontWeight: 'bold',
  },
  /* Gallery container */
  galleryContainer: {
    position: 'absolute',
    bottom: 90,
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  galleryImage: { width: 80, height: 80, margin: 5, borderRadius: 5 },
  saveText: {
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});
