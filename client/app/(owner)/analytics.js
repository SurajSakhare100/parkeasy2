import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import bookingService from '../../services/bookingService';

export default function AnalyticsScreen() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalBookings: 0,
        totalParkings: 0,
        activeSpots: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAnalytics = async () => {
        try {
            const data = await bookingService.getOwnerAnalytics();
            setStats(data);
        } catch (error) {
            console.error("Error fetching analytics", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnalytics();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Analytics</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FBD427" style={{ marginTop: 50 }} />
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <View style={styles.card}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="wallet" size={32} color="#A08A38" />
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardLabel}>Total Revenue</Text>
                            <Text style={styles.cardValue}>₹{stats.totalRevenue.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="calendar" size={32} color="#4C4223" />
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardLabel}>Total Bookings</Text>
                            <Text style={styles.cardValue}>{stats.totalBookings}</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.card, styles.halfCard]}>
                            <Ionicons name="car" size={28} color="#999" />
                            <Text style={styles.cardValueSmall}>{stats.totalParkings}</Text>
                            <Text style={styles.cardLabelSmall}>Total Spots</Text>
                        </View>

                        <View style={[styles.card, styles.halfCard]}>
                            <Ionicons name="checkmark-circle" size={28} color="#2ECC71" />
                            <Text style={styles.cardValueSmall}>{stats.activeSpots}</Text>
                            <Text style={styles.cardLabelSmall}>Active Spots</Text>
                        </View>
                    </View>

                    {stats.aiPrediction && (
                        <View style={styles.aiCard}>
                            <View style={styles.aiHeader}>
                                <Ionicons name="sparkles" size={24} color="#FBD427" />
                                <Text style={styles.aiTitle}>AI Insights & Predictions</Text>
                            </View>
                            <View style={styles.aiContent}>
                                <View style={styles.aiRow}>
                                    <View style={styles.aiItem}>
                                        <Text style={styles.aiLabel}>Est. Revenue Next Month</Text>
                                        <Text style={styles.aiValue}>₹{stats.aiPrediction.predictedRevenueNextMonth.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.aiItem}>
                                        <Text style={styles.aiLabel}>Suggested Price Adj.</Text>
                                        <Text style={[styles.aiValue, { color: '#2ECC71' }]}>{stats.aiPrediction.suggestedPriceAdjustment}</Text>
                                    </View>
                                </View>
                                <View style={styles.aiRow}>
                                    <View style={styles.aiItem}>
                                        <Text style={styles.aiLabel}>Predicted Occupancy</Text>
                                        <Text style={styles.aiValue}>{stats.aiPrediction.predictedOccupancy}</Text>
                                    </View>
                                    <View style={styles.aiItem}>
                                        <Text style={styles.aiLabel}>Demand Trend</Text>
                                        <Text style={[styles.aiValue, { textTransform: 'capitalize' }]}>{stats.aiPrediction.demandTrend}</Text>
                                    </View>
                                </View>
                                <View style={styles.aiRowSingle}>
                                    <View style={styles.aiItem}>
                                        <Text style={styles.aiLabel}>Peak Hours</Text>
                                        <Text style={styles.aiValue}>{stats.aiPrediction.peakHours}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F7F2' },
    header: {
        padding: 20, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#EEE'
    },
    headerText: { fontSize: 24, fontWeight: 'bold', color: '#4C4223' },
    content: { padding: 20 },
    card: {
        backgroundColor: '#FFF', borderRadius: 14, padding: 20, marginBottom: 16,
        flexDirection: 'row', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    iconContainer: {
        backgroundColor: '#F8F7F2', padding: 12, borderRadius: 12, marginRight: 16
    },
    cardInfo: { flex: 1 },
    cardLabel: { fontSize: 16, color: '#666', marginBottom: 4 },
    cardValue: { fontSize: 28, fontWeight: 'bold', color: '#4C4223' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfCard: {
        flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        marginHorizontal: 5, paddingVertical: 24
    },
    cardValueSmall: { fontSize: 24, fontWeight: 'bold', color: '#4C4223', marginVertical: 8 },
    cardLabelSmall: { fontSize: 14, color: '#666' },
    aiCard: {
        backgroundColor: '#1E1E1E', borderRadius: 14, marginTop: 8, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, overflow: 'hidden'
    },
    aiHeader: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', padding: 16,
    },
    aiTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
    aiContent: { padding: 16 },
    aiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    aiRowSingle: { flexDirection: 'row', justifyContent: 'flex-start' },
    aiItem: { flex: 1, paddingRight: 8 },
    aiLabel: { fontSize: 12, color: '#AAA', marginBottom: 4 },
    aiValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' }
});
