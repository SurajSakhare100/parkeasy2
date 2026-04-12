import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../theme';
import parkingService from '../services/parkingService';

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        executeSearch(searchQuery);
      } else {
        setResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const executeSearch = async (query) => {
    try {
      setLoading(true);
      const data = await parkingService.searchParkings(query);
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ParkingDetails', { parking: item })}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="car" size={20} color={COLORS.oliveDark} />
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <Text style={styles.resultAddress}>{item.address || item.locationText}</Text>
      </View>
      <View style={styles.resultStats}>
        <Text style={styles.resultRating}>
          <Ionicons name="star" size={14} color={COLORS.primary} /> 4.5
        </Text>
        <Text style={styles.resultDistance}>—</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Find Best Parking</Text>
        <Text style={styles.subtext}>Enter your location to find them</Text>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color={COLORS.text} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search location..."
            placeholderTextColor={COLORS.textLight}
            autoFocus={true} // Automatically open keyboard
          />
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <Text style={{ textAlign: 'center', color: COLORS.textLight, marginTop: 40 }}>
                {searchQuery.trim() !== '' ? 'No parkings found.' : 'Start typing to search...'}
              </Text>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: '#4C4223', // Matches screenshot
    marginBottom: 8,
  },
  subtext: {
    fontSize: SIZES.font,
    color: COLORS.textLight,
    marginBottom: 25,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A08A38', // Distinct olive border as shown in screenshot
    borderRadius: SIZES.radius - 4,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 30,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  listContainer: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.badgeBg, // Light yellow map pin BG
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: SIZES.small,
    color: '#A0A0A0',
  },
  resultStats: {
    alignItems: 'flex-end',
  },
  resultRating: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  resultDistance: {
    fontSize: SIZES.small,
    color: '#A0A0A0',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  }
});
