import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

export default function HomeScreen() {

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('user');
        DeviceEventEmitter.emit('auth_error');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Owner Dashboard</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={28} color="#A08A38" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.statCard}>
                    <Ionicons name="car-outline" size={40} color="#A08A38" />
                    <Text style={styles.statNumber}>3</Text>
                    <Text style={styles.statLabel}>Active Spots</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="wallet-outline" size={40} color="#A08A38" />
                    <Text style={styles.statNumber}>₹4,250</Text>
                    <Text style={styles.statLabel}>Revenue This Week</Text>
                </View>

                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="add-circle-outline" size={24} color="#FFF" />
                    <Text style={styles.actionButtonText}>Add New Parking Spot</Text>
                </TouchableOpacity>
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4C4223', // oliveDark
    },
    content: {
        padding: 20,
    },
    statCard: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#A08A38',
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#999',
    },
    actionButton: {
        backgroundColor: '#FBD427', // primary yellow
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4C4223',
        marginLeft: 8,
    }
});
