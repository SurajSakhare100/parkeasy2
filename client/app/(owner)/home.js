import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import bookingService from '../../services/bookingService';

export default function HomeScreen() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) setUser(JSON.parse(userStr));
            
            const stats = await bookingService.getOwnerAnalytics();
            setAnalytics(stats);
        } catch(e) {}
    }

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('user');
        DeviceEventEmitter.emit('auth_error');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.headerText}>{user?.name || 'Owner'} 👋</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(owner)/profile')}>
                    <Ionicons name="person-circle-sharp" size={42} color="#A08A38" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.statsOverview}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#FDF2D9' }]}>
                                <Ionicons name="wallet" size={24} color="#A08A38" />
                            </View>
                            <Text style={styles.statNumber}>₹{analytics?.totalRevenue || 0}</Text>
                            <Text style={styles.statLabel}>Revenue</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#E8F8F5' }]}>
                                <Ionicons name="car" size={24} color="#2ECC71" />
                            </View>
                            <Text style={styles.statNumber}>{analytics?.activeSpots || 0}</Text>
                            <Text style={styles.statLabel}>Active Spots</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionSection}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={styles.quickActionBox}
                            activeOpacity={0.8}
                            onPress={() => router.push('/(owner)/my-parkings')}
                        >
                            <Ionicons name="list" size={28} color="#4C4223" style={styles.actionIcon} />
                            <Text style={styles.actionText}>Manage Spots</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.quickActionBox, { backgroundColor: '#FBD427' }]}
                            activeOpacity={0.8}
                            onPress={() => router.push('/(owner)/add-parking')}
                        >
                            <Ionicons name="add-circle" size={28} color="#4C4223" style={styles.actionIcon} />
                            <Text style={[styles.actionText, { color: '#4C4223', fontWeight: 'bold' }]}>Add Spot</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.promoCard}>
                    <Ionicons name="bulb-outline" size={24} color="#FFF" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.promoText}>Optimize your earnings</Text>
                        <Text style={styles.promoSubText}>Check analytics regularly to update pricing.</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F7F2' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 25, paddingTop: 15, paddingBottom: 20, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#EEE',
    },
    greeting: { fontSize: 16, color: '#999', marginBottom: 2 },
    headerText: { fontSize: 24, fontWeight: 'bold', color: '#4C4223' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4C4223', marginBottom: 15 },
    statsOverview: { marginBottom: 30 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    statCard: {
        backgroundColor: '#FFF', width: '48%', borderRadius: 16, padding: 18,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    iconWrapper: { padding: 8, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 12 },
    statNumber: { fontSize: 22, fontWeight: 'bold', color: '#4C4223', marginBottom: 4 },
    statLabel: { fontSize: 14, color: '#666' },
    actionSection: { marginBottom: 30 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    quickActionBox: {
        width: '48%', backgroundColor: '#FFF', borderRadius: 16, padding: 20,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    actionIcon: { marginBottom: 10 },
    actionText: { fontSize: 15, color: '#4C4223', fontWeight: '500' },
    promoCard: {
        flexDirection: 'row', backgroundColor: '#4C4223', borderRadius: 16,
        padding: 20, alignItems: 'center', marginTop: 10, marginBottom: 20
    },
    promoText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    promoSubText: { color: '#CCC', fontSize: 13 }
});
