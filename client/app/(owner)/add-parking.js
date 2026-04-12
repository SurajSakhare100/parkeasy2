import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import parkingService from '../../services/parkingService';

export default function AddParkingScreen() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [pricePerHour, setPricePerHour] = useState('');
    const [totalSlots, setTotalSlots] = useState('');
    const [vehicleType, setVehicleType] = useState('car, bike');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name || !address || !pricePerHour || !totalSlots || !latitude || !longitude) {
            Alert.alert("Error", "Please fill all required fields.");
            return;
        }

        setLoading(true);
        try {
            const formattedVehicleTypes = vehicleType.split(',').map(v => v.trim().toLowerCase());
            
            await parkingService.createParking({
                name,
                address,
                pricePerHour: Number(pricePerHour),
                totalSlots: Number(totalSlots),
                location: {
                    type: "Point",
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                },
                vehicleType: formattedVehicleTypes
            });
            
            Alert.alert("Success", "Parking details added successfully!");
            router.back();
        } catch (error) {
            console.error("Create error", error);
            Alert.alert("Error", "Could not add new parking spot.");
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
                <Text style={styles.headerText}>Add New Parking Spot</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.formContent}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Parking Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. City Mall Parking" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Address</Text>
                    <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Full address" multiline />
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Rate (₹ / hr)</Text>
                        <TextInput style={styles.input} value={pricePerHour} onChangeText={setPricePerHour} keyboardType="numeric" placeholder="e.g. 50" />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Supported Vehicles</Text>
                        <TextInput style={styles.input} value={vehicleType} onChangeText={setVehicleType} placeholder="car, bike" />
                    </View>
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Total Slots</Text>
                        <TextInput style={styles.input} value={totalSlots} onChangeText={setTotalSlots} keyboardType="numeric" placeholder="e.g. 100" />
                    </View>
                </View>

                <Text style={[styles.label, { marginBottom: 10 }]}>Location Coordinates (Required)</Text>
                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Latitude</Text>
                        <TextInput style={styles.input} value={latitude} onChangeText={setLatitude} keyboardType="numeric" placeholder="e.g. 28.6139" />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Longitude</Text>
                        <TextInput style={styles.input} value={longitude} onChangeText={setLongitude} keyboardType="numeric" placeholder="e.g. 77.2090" />
                    </View>
                </View>

                <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleCreate} disabled={loading}>
                    {loading ? <ActivityIndicator color="#4C4223" /> : <Text style={styles.submitBtnText}>Add Parking</Text>}
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
        alignItems: 'center', marginTop: 20, marginBottom: 40
    },
    submitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#4C4223' }
});
