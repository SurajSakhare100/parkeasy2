import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useIsFocused } from 'expo-router';
import parkingService from '../../services/parkingService';

export default function MyParkingsScreen() {
    const [parkings, setParkings] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const isFocused = useIsFocused();

    const FALLBACK_IMAGES = [
        'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400&fit=crop',
        'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=400&fit=crop',
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&fit=crop',
        'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=400&fit=crop',
    ];

    const fetchParkings = async () => {
        try {
            setLoading(true);
            const data = await parkingService.getOwnerParkings();
            setParkings(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load parkings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchParkings();
        }
    }, [isFocused]);

    const handleDelete = async (id) => {
        Alert.alert(
            "Delete Parking",
            "Are you sure you want to delete this parking spot?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await parkingService.deleteParking(id);
                            fetchParkings();
                        } catch (error) {
                            Alert.alert("Error", "Could not delete parking");
                        }
                    }
                }
            ]
        );
    };

    const renderParkingCard = ({ item, index }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push({ pathname: '/(owner)/parking-details', params: { parking: JSON.stringify(item) } })}
        >
            <Image 
                source={{ uri: item.images?.[0] || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] }} 
                style={styles.cardImage} 
            />
            <View style={styles.cardDetails}>
                <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
                <Text style={styles.slots}>Spots: {item.availableSlots}/{item.totalSlots}</Text>
                <Text style={styles.price}>₹{item.pricePerHour}<Text style={styles.priceUnit}>/hr</Text></Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => router.push({ pathname: '/(owner)/edit-parking', params: { parking: JSON.stringify(item) } })}
                >
                    <Ionicons name="pencil" size={22} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleDelete(item._id)}
                >
                    <Ionicons name="trash" size={22} color="#FF6B6B" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#4C4223" />
                </TouchableOpacity>
                <Text style={styles.headerText}>My Parkings</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FBD427" style={{ marginTop: 50 }} />
            ) : parkings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>You haven't listed any parkings yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={parkings}
                    keyExtractor={(item) => item._id}
                    renderItem={renderParkingCard}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F7F2',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backBtn: {
        marginRight: 15,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4C4223',
    },
    listContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        marginBottom: 16,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        overflow: 'hidden',
    },
    cardImage: {
        width: 100,
        height: '100%',
        minHeight: 120,
    },
    cardDetails: {
        flex: 1,
        padding: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C4223',
        marginBottom: 5,
    },
    address: {
        fontSize: 14,
        color: '#999',
        marginBottom: 10,
    },
    slots: {
        fontSize: 14,
        color: '#4C4223',
        fontWeight: '600',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#A08A38',
        marginTop: 4,
    },
    priceUnit: {
        fontSize: 12,
        color: '#999',
        fontWeight: 'normal',
    },
    actions: {
        justifyContent: 'center',
        paddingRight: 10,
        gap: 10,
    },
    actionButton: {
        padding: 8,
        backgroundColor: '#FAFAFA',
        borderRadius: 8,
        marginBottom: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    }
});
