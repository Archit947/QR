import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle, Calendar, FileText, ClipboardList } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogScreen() {
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);

    const fetchLogs = async () => {
        if (!session?.user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('training_progress')
                .select(`
            id,
            status,
            completed_at,
            training_content (
                title,
                type
            )
        `)
                .eq('user_id', session.user.id)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false });

            if (error) throw error;

            const formattedLogs = data.map(item => ({
                id: item.id,
                title: item.training_content?.title || "Unknown Training",
                type: item.training_content?.type || "Module",
                date: item.completed_at ? new Date(item.completed_at).toLocaleDateString() : "Unknown Date",
            }));

            setLogs(formattedLogs);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [session]);

    const renderLogItem = ({ item }) => (
        <View style={styles.logCard}>
            <View style={styles.iconContainer}>
                <CheckCircle size={24} color="#16a34a" />
            </View>
            <View style={styles.logContent}>
                <Text style={styles.logTitle}>{item.title}</Text>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <FileText size={12} color="#64748b" />
                        <Text style={styles.metaText}>{item.type}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Calendar size={12} color="#64748b" />
                        <Text style={styles.metaText}>{item.date}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Training Log</Text>
            </View>

            <FlatList
                data={logs}
                renderItem={renderLogItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchLogs} />}
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconBg}>
                                <ClipboardList size={32} color="#cbd5e1" />
                            </View>
                            <Text style={styles.emptyTitle}>No logs available</Text>
                            <Text style={styles.emptyText}>You haven't completed any training yet.</Text>
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
    listContent: {
        padding: 20,
    },
    logCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#dcfce7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    logContent: {
        flex: 1,
    },
    logTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
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
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
    }
});
