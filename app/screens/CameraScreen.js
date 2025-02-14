import React, { useState, useRef, useEffect } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';

export default function App() {
  // --- All hooks are declared at the top ---
  const [permission, requestPermission] = useCameraPermissions();
  const [gallery, setGallery] = useState([]);
  const [timerDelay, setTimerDelay] = useState(0); // 0, 3, or 5 seconds
  const [gridVisible, setGridVisible] = useState(false);
  const [zoom, setZoom] = useState(0); // Range: 0–1
  const [hdr, setHdr] = useState(false);
  const [filter, setFilter] = useState('none'); // Options: none, sepia, grayscale, cool, warm, vintage
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [focus, setFocus] = useState(0); // Range: 0–1
  const [exposure, setExposure] = useState(0); // Range: –1 to 1
  const [ratio, setRatio] = useState('4:3'); // "4:3" or "16:9"
  const [countdown, setCountdown] = useState(null); // Self‑timer countdown display
  const [flashMode, setFlashMode] = useState('off'); // Options: off, on, auto
  const [facing, setFacing] = useState('back'); // Camera facing

  // States for composite capture when a filter or fun overlay is active
  const [capturedImage, setCapturedImage] = useState(null); // Raw captured image URI
  const [isCompositing, setIsCompositing] = useState(false); // Flag to show composite view
  const [isImageLoaded, setIsImageLoaded] = useState(false); // Indicates that the composite image has loaded

  // New state for the fun overlay feature (available for preview)
  const [funOverlayActive, setFunOverlayActive] = useState(false);

  // New states for preview modal
  const [selectedImage, setSelectedImage] = useState(null); // Holds the image selected from gallery
  const [previewVisible, setPreviewVisible] = useState(false); // Controls preview modal visibility

  // Ref to hold a resolver for composite capture (used in single & burst modes)
  const compositeResolverRef = useRef(null);

  // Refs for CameraView and composite view container
  const cameraRef = useRef(null);
  const compositeRef = useRef(null);

  // --- Toggle Functions ---
  const toggleTimer = () =>
    setTimerDelay((current) => (current === 0 ? 3 : current === 3 ? 5 : 0));
  const toggleGrid = () => setGridVisible((prev) => !prev);
  const toggleHDR = () => setHdr((prev) => !prev);
  const toggleFilter = () => {
    const filters = ['none', 'sepia', 'grayscale', 'cool', 'warm', 'vintage'];
    const currentIndex = filters.indexOf(filter);
    const nextIndex = (currentIndex + 1) % filters.length;
    setFilter(filters[nextIndex]);
  };
  const toggleRatio = () => setRatio((prev) => (prev === '4:3' ? '16:9' : '4:3'));
  const toggleGalleryVisible = () => setGalleryVisible((prev) => !prev);
  const toggleFlash = () => {
    const modes = ['off', 'on', 'auto'];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
  };
  // Fun overlay toggle (for preview)
  const toggleFunOverlay = () => setFunOverlayActive((prev) => !prev);
  const resetSettings = () => {
    setZoom(0);
    setFocus(0);
    setExposure(0);
    setTimerDelay(0);
    setGridVisible(false);
    setHdr(false);
    setFilter('none');
    setRatio('4:3');
    setFlashMode('off');
    setFunOverlayActive(false);
  };

  // --- Save Photo Function ---
  const savePhoto = async (uri) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Photo Saved', 'The photo has been saved to your device.');
      } else {
        Alert.alert(
          'Permission Denied',
          'Media library permission is required to save photos.'
        );
      }
    } catch (error) {
      console.error('Error saving photo:', error);
    }
  };

  // --- Delete Photo Function ---
  const deletePhoto = (index) => {
    setGallery((prev) => {
      const newGallery = [...prev];
      newGallery.splice(index, 1);
      return newGallery;
    });
  };

  // --- Capture Functions ---
  const capturePhoto = async () => {
    // Prevent multiple taps if timer is already running
    if (countdown !== null) return;

    if (cameraRef.current) {
      if (timerDelay > 0) {
        setCountdown(timerDelay);
        const intervalId = setInterval(() => {
          setCountdown((prev) => {
            if (prev === 1) {
              clearInterval(intervalId);
              setCountdown(null);
              doCapture();
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        doCapture();
      }
    }
  };

  // For single capture, if filter or fun overlay is active, use composite capture.
  const doCapture = async () => {
    try {
      if (filter !== 'none' || funOverlayActive) {
        const captured = await cameraRef.current.takePictureAsync();
        console.log('Captured raw image URI:', captured.uri);
        // Await composite capture so that only one image is added.
        const compositeUri = await compositeCapture(captured.uri);
        setGallery((prev) => [...prev, compositeUri]);
      } else {
        const captured = await cameraRef.current.takePictureAsync();
        setGallery((prev) => [...prev, captured.uri]);
        Alert.alert('Photo Captured', 'Your photo was captured successfully!');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'There was an error capturing the photo.');
    }
  };

  // compositeCapture sets the composite state and returns a Promise that resolves with the composite image URI.
  const compositeCapture = (rawUri) => {
    return new Promise((resolve, reject) => {
      try {
        setCapturedImage(rawUri);
        setIsCompositing(true);
        setIsImageLoaded(false);
        compositeResolverRef.current = resolve;
      } catch (error) {
        reject(error);
      }
    });
  };

  // When the composite view's image loads, capture it and resolve the stored promise.
  useEffect(() => {
    if (isCompositing && capturedImage && isImageLoaded && compositeResolverRef.current) {
      (async () => {
        try {
          const compositeUri = await captureRef(compositeRef, {
            format: 'png',
            quality: 1,
          });
          const resolver = compositeResolverRef.current;
          compositeResolverRef.current = null;
          setCapturedImage(null);
          setIsCompositing(false);
          setIsImageLoaded(false);
          resolver(compositeUri);
        } catch (error) {
          console.error('Error capturing composite image:', error);
          compositeResolverRef.current = null;
          setIsCompositing(false);
          setIsImageLoaded(false);
        }
      })();
    }
  }, [isCompositing, capturedImage, isImageLoaded]);

  // Burst capture: for each burst image, if filter or fun overlay is active, process via compositeCapture.
  const burstCapture = async () => {
    if (cameraRef.current) {
      const burstPhotos = [];
      for (let i = 0; i < 5; i++) {
        try {
          const captured = await cameraRef.current.takePictureAsync();
          console.log('Burst raw image URI:', captured.uri);
          let finalUri = captured.uri;
          if (filter !== 'none' || funOverlayActive) {
            finalUri = await compositeCapture(captured.uri);
          }
          burstPhotos.push(finalUri);
        } catch (error) {
          console.error('Error capturing burst photo:', error);
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      setGallery((prev) => [...prev, ...burstPhotos]);
      Alert.alert('Burst Mode', 'Burst photos captured successfully!');
    }
  };

  return (
    <View style={styles.container}>
      {(!permission || !permission.granted) ? (
        <View style={styles.container}>
          <Text style={styles.message}>
            {!permission ? 'Loading...' : 'We need your permission to show the camera'}
          </Text>
          {permission && !permission.granted && (
            <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          {/* Main Camera View */}
          <CameraView
            style={styles.camera}
            facing={facing}
            zoom={zoom}
            hdr={hdr}
            focusDepth={focus}
            exposure={exposure}
            ratio={ratio}
            flashMode={flashMode}
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
            {funOverlayActive && (
              <View style={styles.funOverlay}>
                <Text style={styles.funOverlayText}>🎉 Fun Time! 🎉</Text>
              </View>
            )}
            {countdown !== null && (
              <View style={styles.countdownOverlay}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
          </CameraView>

          {/* Right Control Panel (Sliders) */}
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

          {/* Top Toggle Buttons */}
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
              <TouchableOpacity onPress={toggleFlash} style={styles.toggleButton}>
                <Text style={styles.toggleButtonText}>Flash: {flashMode}</Text>
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
              <TouchableOpacity onPress={toggleFunOverlay} style={styles.toggleButton}>
                <Text style={styles.toggleButtonText}>
                  Fun: {funOverlayActive ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetSettings} style={styles.toggleButton}>
                <Text style={styles.toggleButtonText}>Reset</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.burstButton} onPress={burstCapture}>
              <Text style={styles.burstButtonText}>Burst</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() =>
                setFacing((current) => (current === 'back' ? 'front' : 'back'))
              }
            >
              <Text style={styles.bottomButtonText}>Flip</Text>
            </TouchableOpacity>
          </View>

          {/* Gallery Preview with Modal */}
          {galleryVisible && (
            <View style={styles.galleryContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {gallery.map((uri, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSelectedImage(uri);
                      setPreviewVisible(true);
                    }}
                  >
                    <Image source={{ uri }} style={styles.galleryImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Preview Modal */}
          {previewVisible && selectedImage && (
            <Modal
              transparent={false}
              animationType="slide"
              onRequestClose={() => setPreviewVisible(false)}
            >
              <View style={styles.previewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <View style={styles.previewButtons}>
                  <TouchableOpacity
                    style={styles.previewButton}
                    onPress={() => {
                      savePhoto(selectedImage);
                      setPreviewVisible(false);
                      setSelectedImage(null);
                    }}
                  >
                    <Text style={styles.previewButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.previewButton}
                    onPress={() => {
                      setPreviewVisible(false);
                      setSelectedImage(null);
                    }}
                  >
                    <Text style={styles.previewButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.previewButton}
                    onPress={() => {
                      deletePhoto(gallery.indexOf(selectedImage));
                      setPreviewVisible(false);
                      setSelectedImage(null);
                    }}
                  >
                    <Text style={styles.previewButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* Composite View for processing overlays (hidden) */}
          {isCompositing && capturedImage && (
            <View
              collapsable={false}
              ref={compositeRef}
              style={styles.compositeContainer}
            >
              <Image
                source={{ uri: capturedImage }}
                style={styles.compositeImage}
                onLoadEnd={() => {
                  setIsImageLoaded(true);
                  handleCompositeLoad();
                }}
              />
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
              {funOverlayActive && (
                <View style={styles.funOverlay}>
                  <Text style={styles.funOverlayText}>🎉 Fun Time! 🎉</Text>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

// Helper function: When the composite view image loads, capture it and resolve the stored promise.
const handleCompositeLoad = async () => {
  if (compositeResolverRef.current) {
    try {
      const compositeUri = await captureRef(compositeRef, {
        format: 'png',
        quality: 1,
      });
      const resolver = compositeResolverRef.current;
      compositeResolverRef.current = null;
      setCapturedImage(null);
      setIsCompositing(false);
      setIsImageLoaded(false);
      resolver(compositeUri);
    } catch (error) {
      console.error('Error in handleCompositeLoad:', error);
      compositeResolverRef.current = null;
      setIsCompositing(false);
      setIsImageLoaded(false);
    }
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  message: { textAlign: 'center', paddingBottom: 10, fontSize: 16 },
  permissionButton: {
    backgroundColor: '#00000080',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
  },
  permissionButtonText: { color: 'white', fontSize: 16 },
  camera: { flex: 1 },
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
  topToggles: { position: 'absolute', top: 20, left: 0, right: 0 },
  toggleButton: {
    backgroundColor: '#00000080',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  toggleButtonText: { color: 'white', fontSize: 10 },
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
  countdownText: { fontSize: 60, color: 'white', fontWeight: 'bold' },
  galleryContainer: { position: 'absolute', bottom: 90, width: '100%', height: 80, backgroundColor: 'rgba(0,0,0,0.5)' },
  galleryImage: { width: 80, height: 80, margin: 5, borderRadius: 5 },
  saveText: { color: 'white', fontSize: 8, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  compositeContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
  compositeImage: { width: '100%', height: '100%' },
  // Fun overlay styles (available for preview)
  funOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  funOverlayText: {
    fontSize: 40,
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  // Preview modal styles
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  previewButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  previewButton: {
    backgroundColor: '#00000080',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 20,
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
  },
});