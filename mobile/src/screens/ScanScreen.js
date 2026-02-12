import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { getMachineByQr } from '../lib/api';
import CoursePlayer from './components/CoursePlayer';
import { useCourses } from '../contexts/CoursesContext';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);
  const [scanned, setScanned] = useState(false);
  const { addOrUpdateCourse } = useCourses();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleScan = async ({ data }) => {
    if (loading || scanned) return;
    setScanned(true);
    // Debug: Show scanned QR value
    console.log('Scanned QR value:', data);
    Alert.alert('Scanned QR', data, [
      { text: 'Continue', onPress: async () => {
        try {
          setLoading(true);
          // Extract ID from URL if needed
          let qrId = data;
          const match = data.match(/([0-9a-fA-F\-]{36})$/);
          if (match) qrId = match[1];
          console.log('Using QR ID:', qrId);
          const machine = await getMachineByQr(qrId);
          setActiveCourse(machine);
          addOrUpdateCourse(machine);
        } catch (err) {
          Alert.alert('Error', err.message || 'Failed to fetch training', [
            { text: 'OK', onPress: () => setScanned(false) }
          ]);
        } finally {
          setLoading(false);
        }
      }}
    ]);
  };

  const handleReset = () => {
    setActiveCourse(null);
    setScanned(false);
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.center}><Text>No camera access</Text></View>;
  }

  if (activeCourse) {
    return <CoursePlayer course={activeCourse} onBack={handleReset} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.scannerBox}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleScan}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "pdf417"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
      </View>
      <Text style={styles.hint}>Scan the machine QR to load training</Text>
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Reset Scanner</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  scannerBox: { width: '90%', aspectRatio: 1, overflow: 'hidden', borderRadius: 12, borderWidth: 2, borderColor: '#2563eb' },
  hint: { marginTop: 12, color: '#475569' },
  button: { marginTop: 16, backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
