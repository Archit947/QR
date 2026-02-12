import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Lock, Settings, LogOut, ChevronRight, Camera, X, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
    const { session, signOut } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');

    // Password Change State
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });

    const fetchProfile = async () => {
        try {
            if (!session?.user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) throw error;

            setProfile(data);
            setEditName(data.full_name || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [session]);

    const handleUpdateProfile = async () => {
        if (!editName.trim()) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: editName })
                .eq('id', session.user.id);

            if (error) throw error;

            setProfile(prev => ({ ...prev, full_name: editName }));
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleUpdatePassword = async () => {
        if (passwords.new.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        if (passwords.new !== passwords.confirm) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: passwords.new });
            if (error) throw error;
            Alert.alert('Success', 'Password updated successfully');
            setShowPasswordChange(false);
            setPasswords({ new: '', confirm: '' });
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (loading) return null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: `https://ui-avatars.com/api/?background=0D8ABC&color=fff&size=128&name=${profile?.full_name || 'User'}` }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.cameraButton}>
                            <Camera size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {isEditing ? (
                        <View style={styles.editNameContainer}>
                            <TextInput
                                style={styles.nameInput}
                                value={editName}
                                onChangeText={setEditName}
                                autoFocus
                            />
                            <View style={styles.editActions}>
                                <TouchableOpacity onPress={handleUpdateProfile} style={[styles.iconBtn, styles.saveBtn]}>
                                    <Check size={16} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsEditing(false)} style={[styles.iconBtn, styles.cancelBtn]}>
                                    <X size={16} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.infoContainer}>
                            <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
                            <Text style={styles.userRole}>{profile?.role?.toUpperCase()} • {profile?.id?.substring(0, 4).toUpperCase()}</Text>
                            <Text style={styles.userEmail}>{session?.user?.email}</Text>
                        </View>
                    )}
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {/* Edit Profile */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => setIsEditing(true)}>
                        <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
                            <User size={20} color="#3b82f6" />
                        </View>
                        <Text style={styles.menuText}>Edit Profile</Text>
                        <ChevronRight size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    {/* Change Password */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => setShowPasswordChange(!showPasswordChange)}>
                        <View style={[styles.menuIcon, { backgroundColor: '#f0fdf4' }]}>
                            <Lock size={20} color="#16a34a" />
                        </View>
                        <Text style={styles.menuText}>Change Password</Text>
                        <ChevronRight size={20} color={showPasswordChange ? "#3b82f6" : "#cbd5e1"} style={showPasswordChange ? { transform: [{ rotate: '90deg' }] } : {}} />
                    </TouchableOpacity>

                    {/* Password Form */}
                    {showPasswordChange && (
                        <View style={styles.passwordForm}>
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                secureTextEntry
                                value={passwords.new}
                                onChangeText={text => setPasswords(prev => ({ ...prev, new: text }))}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                secureTextEntry
                                value={passwords.confirm}
                                onChangeText={text => setPasswords(prev => ({ ...prev, confirm: text }))}
                            />
                            <TouchableOpacity style={styles.savePasswordBtn} onPress={handleUpdatePassword}>
                                <Text style={styles.savePasswordText}>Update Password</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* App Settings */}
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIcon, { backgroundColor: '#fdf4ff' }]}>
                            <Settings size={20} color="#c026d3" />
                        </View>
                        <Text style={styles.menuText}>App Settings</Text>
                        <ChevronRight size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    {/* Logout */}
                    <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                        <View style={[styles.menuIcon, { backgroundColor: '#fef2f2' }]}>
                            <LogOut size={20} color="#ef4444" />
                        </View>
                        <Text style={[styles.menuText, { color: '#ef4444' }]}>Logout</Text>
                    </TouchableOpacity>
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
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#f1f5f9',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3b82f6',
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#fff',
    },
    infoContainer: {
        alignItems: 'center',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3b82f6',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
    },
    userEmail: {
        fontSize: 14,
        color: '#64748b',
    },
    editNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    nameInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        width: 200,
        fontSize: 16,
    },
    editActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtn: {
        backgroundColor: '#16a34a',
    },
    cancelBtn: {
        backgroundColor: '#f1f5f9',
    },
    menuContainer: {
        gap: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#0f172a',
    },
    passwordForm: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        marginTop: -8,
        marginBottom: 12,
        gap: 12,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
    },
    savePasswordBtn: {
        backgroundColor: '#3b82f6',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    savePasswordText: {
        color: '#fff',
        fontWeight: '600',
    },
});
