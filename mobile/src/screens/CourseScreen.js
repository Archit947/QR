
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CoursePlayer from './components/CoursePlayer';

export default function CourseScreen({ route, navigation }) {
  const { course } = route.params || {};
  if (!course) return null;
  return <CoursePlayer course={course} onBack={() => navigation.goBack()} />;
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
