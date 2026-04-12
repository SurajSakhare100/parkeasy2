import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import bookingService from '../../services/bookingService';

export default function BookingsScreen() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, today, yesterday, month

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await bookingService.getOwnerBookings(filter);
            setBookings(data);
        } catch (error) {
            console.error("Error fetching bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [filter]);

    const FilterButton = ({ title, value }) => (
        <TouchableOpacity 
            style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
            onPress={() => setFilter(value)}
        >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    const renderBooking = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.parkingName}>{item.parkingId?.name || 'Unknown Parking'}</Text>
                <Text style={styles.amount}>₹{item.totalAmount}</Text>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="person-circle-outline" size={18} color="#666" />
                    <Text style={styles.infoText}>{item.userId?.name || 'Customer'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={18} color="#666" />
                    <Text style={styles.infoText}>
                        {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="car-outline" size={18} color="#666" />
                    <Text style={styles.infoText}>Vehicle: {item.vehicleType}</Text>
                </View>
            </View>
            <View style={styles.statusRow}>
                <Text style={[styles.statusTag, item.status === 'completed' && styles.statusCompleted]}>
                    {item.status.replace('_', ' ').toUpperCase()}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Bookings</Text>
            </View>

            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
                    <FilterButton title="All" value="all" />
                    <FilterButton title="Today" value="today" />
                    <FilterButton title="Yesterday" value="yesterday" />
                    <FilterButton title="This Month" value="month" />
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FBD427" style={{ marginTop: 50 }} />
            ) : bookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No bookings found.</Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item._id}
                    renderItem={renderBooking}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F7F2' },
    header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    headerText: { fontSize: 24, fontWeight: 'bold', color: '#4C4223' },
    filtersContainer: { backgroundColor: '#FFF', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    filtersScroll: { paddingHorizontal: 15 },
    filterBtn: { 
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, 
        backgroundColor: '#F0F0F0', marginRight: 10,
    },
    filterBtnActive: { backgroundColor: '#4C4223' },
    filterText: { color: '#666', fontWeight: '500' },
    filterTextActive: { color: '#FFF' },
    listContainer: { padding: 15, paddingBottom: 30 },
    card: {
        backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    parkingName: { fontSize: 16, fontWeight: 'bold', color: '#4C4223', flex: 1 },
    amount: { fontSize: 16, fontWeight: 'bold', color: '#2ECC71' },
    cardBody: { marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    infoText: { fontSize: 14, color: '#666', marginLeft: 8 },
    statusRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    statusTag: { 
        fontSize: 12, fontWeight: 'bold', color: '#A08A38', 
        backgroundColor: '#FDF2D9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 
    },
    statusCompleted: { color: '#2ECC71', backgroundColor: '#E8F8F5' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', fontSize: 16 }
});
