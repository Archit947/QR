import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FileText, CheckCircle, Clock, Play } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OverviewScreen({ navigation }) {
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        completed: 0,
        assigned: 0,
        progress: 0
    });
    const [pendingTrainings, setPendingTrainings] = useState([]);
    const [userProfile, setUserProfile] = useState({
        name: "Worker",
        role: "EMPLOYEE",
        id: "---"
    });

    const fetchDashboardData = async () => {
        if (!session?.user) return;
        setLoading(true);

        try {
            // 1. Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                setUserProfile({
                    name: profile.full_name || session.user.email.split('@')[0],
                    role: profile.role ? profile.role.toUpperCase() : "EMPLOYEE",
                    id: profile.id.substring(0, 4).toUpperCase(),
                });
            }

            // 2. Fetch Training Stats
            const { data: progressData, error } = await supabase
                .from('training_progress')
                .select(`
            id,
            status,
            content_id,
            training_content (
                id,
                title,
                type
            )
        `)
                .eq('user_id', session.user.id);

            if (error) throw error;

            let completed = 0;
            let started = 0;
            const active = [];

            progressData.forEach(item => {
                if (item.status === 'completed') completed++;
                if (item.status === 'started') {
                    started++;
                    active.push({
                        id: item.content_id,
                        title: item.training_content?.title || "Unknown Training",
                        type: item.training_content?.type || "Module",
                        status: "IN PROGRESS",
                        progress: 30, // Placeholder
                    });
                }
            });

            const total = completed + started;
            const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            setStats({
                completed,
                assigned: total,
                progress: progressPercentage
            });

            setPendingTrainings(active);

        } catch (error) {
            console.error("Error fetching overview:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [session]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.userName}>{userProfile.name}</Text>
                    </View>
                    <View style={styles.profileBadge}>
                        <Text style={styles.profileInitials}>{userProfile.name.charAt(0)}</Text>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#dbeafe' }]}>
                            <CheckCircle size={20} color="#2563eb" />
                        </View>
                        <Text style={[styles.statValue, { color: '#2563eb' }]}>{stats.completed}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#fdf2f8' }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#fce7f3' }]}>
                            <Clock size={20} color="#db2777" />
                        </View>
                        <Text style={[styles.statValue, { color: '#db2777' }]}>{stats.assigned}</Text>
                        <Text style={styles.statLabel}>Total Assigned</Text>
                    </View>
                </View>

                {/* Active Training Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Continue Training</Text>
                    {pendingTrainings.length > 0 ? (
                        pendingTrainings.map((item, index) => (
                            <TouchableOpacity key={index} style={styles.trainingCard}>
                                <View style={styles.trainingIcon}>
                                    <Play size={20} color="#fff" />
                                </View>
                                <View style={styles.trainingInfo}>
                                    <Text style={styles.trainingTitle}>{item.title}</Text>
                                    <Text style={styles.trainingType}>{item.type} • {item.status}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <FileText size={40} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No active training</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 14,
        color: '#64748b',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    profileBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitials: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#475569',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 16,
    },
    trainingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
    },
    trainingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    trainingInfo: {
        flex: 1,
    },
    trainingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    trainingType: {
        fontSize: 12,
        color: '#64748b',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    emptyText: {
        marginTop: 8,
        color: '#94a3b8',
        fontSize: 14,
    },
});
