import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { getMachineByQr } from '../lib/api';
import CoursePlayer from './components/CoursePlayer';

// Placeholder: you might want a list of assigned machines/courses for the user
export default function CourseScreen() {
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState(null);

  // TODO: fetch assigned courses for logged-in user; for now we just show placeholder list
  const mockCourses = [];

  useEffect(() => {
    // optionally load default course
  }, []);

  if (course) {
    return <CoursePlayer course={course} onBack={() => setCourse(null)} />;
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Training</Text>
      {mockCourses.length === 0 && (
        <Text style={styles.muted}>No assigned courses yet. Scan a QR to start.</Text>
      )}
      <FlatList
        data={mockCourses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setCourse(item)}>
            <Text style={styles.cardTitle}>{item.machine_name}</Text>
            <Text style={styles.cardSub}>{item.location}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: 'white' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  muted: { color: '#94a3b8' },
  card: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  cardTitle: { fontWeight: '700', fontSize: 16 },
  cardSub: { color: '#475569', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
