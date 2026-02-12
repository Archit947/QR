
export default function AcademyScreen({ navigation }) {
    const { session } = useAuth();
    const { courses, setCourses } = useCourses();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCourses = async () => {
        setLoading(true);
        try {
            // Fetch all training content
            // In a real app, you might want to filter by department or assignments
            const { data: allContent, error } = await supabase
                .from('training_content')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch user progress to mark completed/started
            const { data: userProgress } = await supabase
                .from('training_progress')
                .select('content_id, status')
                .eq('user_id', session.user.id);

            const progressMap = {};
            userProgress?.forEach(p => {
                progressMap[p.content_id] = p.status;
            });

            const mappedCourses = allContent.map(course => ({
                ...course,
                status: progressMap[course.id] || 'not_started'
            }));

            setCourses(mappedCourses);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const renderCourseItem = ({ item }) => (
        <TouchableOpacity style={styles.courseCard} onPress={() => navigation.navigate('Course', { course: item })}>
            <View style={styles.courseImagePlaceholder}>
                <BookOpen size={24} color="#3b82f6" />
            </View>
            <View style={styles.courseContent}>
                <Text style={styles.courseTitle}>{item.title}</Text>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Clock size={12} color="#64748b" />
                        <Text style={styles.metaText}>{item.type === 'Video' ? '15m' : '10m'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={[
                            styles.statusBadge,
                            item.status === 'completed' && styles.statusCompleted,
                            item.status === 'started' && styles.statusStarted
                        ]}>
                            {item.status === 'not_started' ? 'New' : item.status}
                        </Text>
                    </View>
                </View>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Academy</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Filter size={20} color="#64748b" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={courses}
                renderItem={renderCourseItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchCourses} />}
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No courses available</Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    filterButton: {
        padding: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    listContent: {
        padding: 20,
    },
    courseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    courseImagePlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    courseContent: {
        flex: 1,
    },
    courseTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#64748b',
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: '600',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    statusCompleted: {
        backgroundColor: '#dcfce7',
        color: '#166534',
    },
    statusStarted: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#94a3b8',
    }
});
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCourses } from '../contexts/CoursesContext';
import { supabase } from '../lib/supabase';
import { BookOpen, Filter, Clock, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
