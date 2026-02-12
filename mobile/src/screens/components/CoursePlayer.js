import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { WebView } from 'react-native-webview';
import { updateProgress } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function CoursePlayer({ course, onBack }) {
  const [activeContent, setActiveContent] = useState(course.training_content?.[0] || null);

  const handleComplete = async (contentId) => {
    try {
      await updateProgress({ userId: course.user_id, contentId, status: 'completed' });
    } catch (err) {
      console.warn('Failed to mark complete', err.message);
    }
  };

  const renderContent = () => {
    if (!activeContent) return null;
    if (activeContent.type === 'Video') {
      return (
        <Video
          source={{ uri: activeContent.url }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) handleComplete(activeContent.id);
          }}
        />
      );
    }
    return (
      <WebView
        originWhitelist={["*"]}
        source={{ uri: activeContent.url }}
        style={styles.pdf}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{course.machine_name}</Text>
          <Text style={styles.subtitle}>{course.location}</Text>
        </View>
      </View>

      <View style={styles.playerBox}>{renderContent()}</View>

      <FlatList
        data={course.training_content}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isActive = activeContent?.id === item.id;
          const isLocked = index > 0 && course.training_content[index - 1]?.status !== 'completed';
          return (
            <TouchableOpacity
              disabled={isLocked}
              onPress={() => setActiveContent(item)}
              style={[styles.moduleRow, isActive && styles.activeRow, isLocked && styles.locked]}
            >
              <Text style={styles.moduleTitle}>{item.title}</Text>
              <Text style={styles.moduleMeta}>{item.type} • {item.duration ? Math.round(item.duration/60) + ' mins' : ''}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { padding: 12, borderBottomWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { color: '#2563eb', fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { color: '#64748b', fontSize: 12 },
  playerBox: { width: '100%', aspectRatio: 16/9, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
  pdf: { flex: 1 },
  moduleRow: { padding: 14, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  activeRow: { backgroundColor: '#eff6ff' },
  locked: { opacity: 0.5 },
  moduleTitle: { fontWeight: '700' },
  moduleMeta: { color: '#64748b', marginTop: 2 },
});
