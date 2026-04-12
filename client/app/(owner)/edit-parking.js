import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import parkingService from '../../services/parkingService';

export default function EditParkingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Safely parse parking context
    const parking = params?.parking ? (typeof params.parking === 'string' ? JSON.parse(params.parking) : params.parking) : null;

    const [name, setName] = useState(parking?.name || '');
    const [address, setAddress] = useState(parking?.address || '');
    const [pricePerHour, setPricePerHour] = useState(parking?.pricePerHour?.toString() || '');
    const [totalSlots, setTotalSlots] = useState(parking?.totalSlots?.toString() || '');
    const [availableSlots, setAvailableSlots] = useState(parking?.availableSlots?.toString() || '');
    const [vehicleType, setVehicleType] = useState(parking?.vehicleType?.join(', ') || 'car, bike');
    
    const [loading, setLoading] = useState(false);

    if (!parking) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 50 }}>Parking details missing.</Text>
            </SafeAreaView>
        );
    }

    const handleUpdate = async () => {
        if (!name || !address || !pricePerHour || !totalSlots || !availableSlots) {
            Alert.alert("Error", "Please fill all required fields.");
            return;
        }

        setLoading(true);
        try {
            const formattedVehicleTypes = vehicleType.split(',').map(v => v.trim().toLowerCase());
            
            await parkingService.updateParking(parking._id, {
                name,
                address,
                pricePerHour: Number(pricePerHour),
                totalSlots: Number(totalSlots),
                availableSlots: Number(availableSlots),
                vehicleType: formattedVehicleTypes
            });
            
            Alert.alert("Success", "Parking details updated successfully!");
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert("Update Failed", "Could not update parking details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#4C4223" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Edit Parking Spot</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.formContent}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Parking Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Phoenix Marketcity Parking" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Address</Text>
                    <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Full address" multiline />
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Rate (₹ / hr)</Text>
                        <TextInput style={styles.input} value={pricePerHour} onChangeText={setPricePerHour} keyboardType="numeric" />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Supported Vehicles</Text>
                        <TextInput style={styles.input} value={vehicleType} onChangeText={setVehicleType} placeholder="car, bike" />
                    </View>
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Total Slots</Text>
                        <TextInput style={styles.input} value={totalSlots} onChangeText={setTotalSlots} keyboardType="numeric" />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Available Slots</Text>
                        <TextInput style={styles.input} value={availableSlots} onChangeText={setAvailableSlots} keyboardType="numeric" />
                    </View>
                </View>

                <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleUpdate} disabled={loading}>
                    {loading ? <ActivityIndicator color="#4C4223" /> : <Text style={styles.submitBtnText}>Update Parking</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F7F2' },
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#EEE'
    },
    backBtn: { marginRight: 15 },
    headerText: { fontSize: 20, fontWeight: 'bold', color: '#4C4223' },
    formContent: { padding: 20 },
    inputGroup: { marginBottom: 20 },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
    input: {
        backgroundColor: '#FFF', borderRadius: 10, padding: 14, fontSize: 16,
        borderWidth: 1, borderColor: '#DDD', color: '#333'
    },
    submitBtn: {
        backgroundColor: '#FBD427', borderRadius: 12, paddingVertical: 16, 
        alignItems: 'center', marginTop: 20
    },
    submitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#4C4223' }
});
