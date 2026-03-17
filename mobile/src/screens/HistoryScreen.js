import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, FileText, ClipboardList, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const USER_ID_FIELDS = ['user_id', 'employee_id', 'profile_id', 'assigned_to', 'created_by'];

const STATUS_FIELDS = ['status', 'state'];
const COMPLETED_VALUES = ['completed', 'complete', 'closed', 'done', 'approved'];

const HISTORY_TABLES = [
    { key: 'audits', table: 'audits', title: 'Audits', completedOnly: false },
    { key: 'workOrders', table: 'work_orders', title: 'Completed Work Orders', completedOnly: true },
    { key: 'checklists', table: 'checklists', title: 'Completed Checklists', completedOnly: true },
    { key: 'logsheets', table: 'logsheets', title: 'Completed Logsheets', completedOnly: true },
];

const getDateText = (item) => {
    const value = item.completed_at || item.closed_at || item.done_at || item.updated_at || item.created_at;
    if (!value) return 'Unknown Date';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Unknown Date';
    return parsed.toLocaleDateString();
};

const getTitleText = (item, fallbackPrefix) => {
    return (
        item.title ||
        item.name ||
        item.audit_name ||
        item.work_order_name ||
        item.checklist_name ||
        item.logsheet_name ||
        item.reference ||
        `${fallbackPrefix} #${String(item.id || '').slice(0, 8) || 'Record'}`
    );
};

const isCompletedRecord = (item) => {
    if (item.completed_at || item.closed_at || item.done_at) return true;

    for (const field of STATUS_FIELDS) {
        const raw = item[field];
        if (typeof raw !== 'string') continue;
        if (COMPLETED_VALUES.includes(raw.toLowerCase())) {
            return true;
        }
    }

    return false;
};

async function fetchUserRecords(tableName, userId) {
    for (const field of USER_ID_FIELDS) {
        const { data, error } = await supabase.from(tableName).select('*').eq(field, userId);
        if (!error) {
            return data || [];
        }
    }

    return [];
}

const emptyHistory = {
    trainings: [],
    audits: [],
    workOrders: [],
    checklists: [],
    logsheets: [],
};

export default function HistoryScreen() {
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState(emptyHistory);

    const fetchHistory = async () => {
        if (!session?.user?.id) {
            setHistory(emptyHistory);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const { data: trainingData, error: trainingError } = await supabase
                .from('training_progress')
                .select(`
                    id,
                    status,
                    completed_at,
                    created_at,
                    training_content (
                        title,
                        type
                    )
                `)
                .eq('user_id', session.user.id)
                .eq('status', 'completed');

            if (trainingError) throw trainingError;

            const trainings = (trainingData || [])
                .map((item) => ({
                    id: item.id,
                    title: item.training_content?.title || 'Unknown Training',
                    type: item.training_content?.type || 'Training',
                    date: getDateText(item),
                }))
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            const tableResults = await Promise.all(
                HISTORY_TABLES.map(async (config) => {
                    const records = await fetchUserRecords(config.table, session.user.id);

                    const filtered = config.completedOnly ? records.filter(isCompletedRecord) : records;

                    const normalized = filtered.map((item) => ({
                        id: String(item.id || `${config.key}-${Math.random()}`),
                        title: getTitleText(item, config.title.replace('Completed ', '').replace(/s$/, '')),
                        type: config.title,
                        date: getDateText(item),
                    }));

                    return [config.key, normalized];
                })
            );

            const mapped = Object.fromEntries(tableResults);

            setHistory({
                trainings,
                audits: mapped.audits || [],
                workOrders: mapped.workOrders || [],
                checklists: mapped.checklists || [],
                logsheets: mapped.logsheets || [],
            });
        } catch (error) {
            console.error('Error fetching history:', error);
            setHistory(emptyHistory);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [session?.user?.id]);

    const sections = [
        { title: 'Audits', items: history.audits },
        { title: 'Completed Work Orders', items: history.workOrders },
        { title: 'Completed Checklists', items: history.checklists },
        { title: 'Completed Logsheets', items: history.logsheets },
        { title: 'Completed Training', items: history.trainings },
    ];

    const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>History</Text>
                <Text style={styles.headerSubtitle}>Your completed work orders, audits, checklists and logsheets</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHistory} />}
            >
                {totalItems === 0 && !loading ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconBg}>
                            <ClipboardList size={32} color="#cbd5e1" />
                        </View>
                        <Text style={styles.emptyTitle}>No history available</Text>
                        <Text style={styles.emptyText}>Your completed records will appear here.</Text>
                    </View>
                ) : (
                    sections.map((section) => (
                        <View key={section.title} style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <Text style={styles.sectionCount}>{section.items.length}</Text>
                            </View>

                            {section.items.length === 0 ? (
                                <Text style={styles.sectionEmptyText}>No records found</Text>
                            ) : (
                                section.items.map((item) => (
                                    <View key={`${section.title}-${item.id}`} style={styles.itemCard}>
                                        <View style={styles.iconContainer}>
                                            <CheckCircle size={18} color="#16a34a" />
                                        </View>
                                        <View style={styles.itemContent}>
                                            <Text style={styles.itemTitle}>{item.title}</Text>
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
                                ))
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
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
    headerSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: '#64748b',
    },
    content: {
        padding: 16,
        paddingBottom: 28,
    },
    sectionCard: {
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },
    sectionCount: {
        minWidth: 22,
        textAlign: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: '#eff6ff',
        color: '#2563eb',
        fontSize: 12,
        fontWeight: '700',
    },
    sectionEmptyText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    iconContainer: {
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: '#dcfce7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    metaText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#64748b',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 70,
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
    },
});