import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OwnerParkingDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Safely parse parking parameter
    const parking = params?.parking ? (typeof params.parking === 'string' ? JSON.parse(params.parking) : params.parking) : null;

    if (!parking) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 50 }}>Parking details missing.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#4C4223" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Spot Overview</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/(owner)/edit-parking', params: { parking: JSON.stringify(parking) } })}>
                    <Ionicons name="pencil-outline" size={24} color="#A08A38" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {parking.images && parking.images.length > 0 ? (
                    <ScrollView 
                        horizontal 
                        pagingEnabled 
                        showsHorizontalScrollIndicator={false} 
                        style={styles.carouselContainer}
                        contentContainerStyle={styles.carouselContent}
                    >
                        {parking.images.map((img, i) => (
                            <Image key={i} source={{ uri: img }} style={styles.carouselImage} />
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="car-sport" size={60} color="#E0E0E0" />
                    </View>
                )}

                <View style={styles.infoCard}>
                    <Text style={styles.title}>{parking.name}</Text>
                    <Text style={styles.address}><Ionicons name="location-outline" size={14} color="#999" /> {parking.address}</Text>

                    <View style={styles.divider} />

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>₹{parking.pricePerHour}</Text>
                            <Text style={styles.statLabel}>Per Hour</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>{parking.totalSlots}</Text>
                            <Text style={styles.statLabel}>Total Slots</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: 18 }}>{parking.availableSlots}</Text>
                            <Text style={styles.statLabel}>Available</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Supported Vehicles</Text>
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        {parking.vehicleType?.map((type, i) => (
                            <View key={i} style={styles.tag}>
                                <Text style={styles.tagText}>{type.toUpperCase()}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F7F2' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE'
    },
    backBtn: { padding: 4 },
    headerText: { fontSize: 20, fontWeight: 'bold', color: '#4C4223' },
    content: { padding: 20 },
    imagePlaceholder: {
        width: '100%', height: 180, backgroundColor: '#FFF', borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
        borderWidth: 1, borderColor: '#EEE'
    },
    carouselContainer: {
        marginBottom: 20,
    },
    carouselContent: {
        alignItems: 'center',
    },
    carouselImage: {
        width: Dimensions.get('window').width - 40, // padding adjustment
        height: 200, 
        borderRadius: 14, 
        marginRight: 10,
        borderWidth: 1, 
        borderColor: '#EEE'
    },
    infoCard: {
        backgroundColor: '#FFF', borderRadius: 14, padding: 20, marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
    },
    title: { fontSize: 22, fontWeight: 'bold', color: '#4C4223', marginBottom: 8 },
    address: { fontSize: 14, color: '#999', lineHeight: 20 },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { alignItems: 'center', flex: 1 },
    statVal: { fontSize: 18, fontWeight: 'bold', color: '#4C4223' },
    statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#4C4223' },
    tag: { backgroundColor: '#FBD427', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 10 },
    tagText: { fontSize: 12, fontWeight: 'bold', color: '#4C4223' }
});
