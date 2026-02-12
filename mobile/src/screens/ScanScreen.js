import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { getMachineByQr } from '../lib/api';
import CoursePlayer from './components/CoursePlayer';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleScan = async ({ data }) => {
    if (loading) return;
    try {
      setLoading(true);
      const machine = await getMachineByQr(data);
      setActiveCourse(machine);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch training');
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.center}><Text>No camera access</Text></View>;
  }

  if (activeCourse) {
    return <CoursePlayer course={activeCourse} onBack={() => setActiveCourse(null)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.scannerBox}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <BarCodeScanner
            onBarCodeScanned={handleScan}
            style={StyleSheet.absoluteFillObject}
          />
        )}
      </View>
      <Text style={styles.hint}>Scan the machine QR to load training</Text>
      <TouchableOpacity style={styles.button} onPress={() => setActiveCourse(null)}>
        <Text style={styles.buttonText}>Reset</Text>
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
