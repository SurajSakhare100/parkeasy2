import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

export default function ProfileScreen() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                setUser(JSON.parse(userStr));
            }
        };
        loadUser();
    }, []);

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem('userToken');
                        await AsyncStorage.removeItem('user');
                        DeviceEventEmitter.emit('auth_error');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>My Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={50} color="#FBD427" />
                    </View>
                    <Text style={styles.name}>{user?.name || 'Owner'}</Text>
                    <Text style={styles.email}>{user?.email || '+91 ' + (user?.phone || 'Unknown')}</Text>
                    <View style={styles.roleTag}>
                        <Text style={styles.roleText}>Business Owner</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons name="person-outline" size={24} color="#666" />
                        <Text style={styles.settingText}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons name="lock-closed-outline" size={24} color="#666" />
                        <Text style={styles.settingText}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons name="notifications-outline" size={24} color="#666" />
                        <Text style={styles.settingText}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons name="document-text-outline" size={24} color="#666" />
                        <Text style={styles.settingText}>Terms & Conditions</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F7F2' },
    header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    headerText: { fontSize: 24, fontWeight: 'bold', color: '#4C4223' },
    content: { paddingBottom: 100, paddingTop: 20, paddingHorizontal: 20 },
    profileHeader: {
        alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16,
        padding: 30, marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    avatar: {
        width: 100, height: 100, borderRadius: 50, backgroundColor: '#FAFAFA',
        justifyContent: 'center', alignItems: 'center', marginBottom: 15,
        borderWidth: 2, borderColor: '#FBD427'
    },
    name: { fontSize: 24, fontWeight: 'bold', color: '#4C4223', marginBottom: 5 },
    email: { fontSize: 16, color: '#666', marginBottom: 15 },
    roleTag: {
        backgroundColor: '#FDF2D9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20
    },
    roleText: { color: '#A08A38', fontWeight: 'bold', fontSize: 12 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#999', marginBottom: 10, marginLeft: 10 },
    settingItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        padding: 16, borderRadius: 12, marginBottom: 8,
    },
    settingText: { flex: 1, fontSize: 16, color: '#4C4223', marginLeft: 15 },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginTop: 10,
        borderWidth: 1, borderColor: '#FFEEEE'
    },
    logoutText: { fontSize: 16, fontWeight: 'bold', color: '#FF6B6B', marginLeft: 10 }
});
