import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useIsFocused, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import parkingService from '../../services/parkingService';
import userService from '../../services/userService';
import FilterModal from '../../components/FilterModal';
import { useTheme } from '../../context/ThemeContext';

export default function SearchScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { initialFilters } = useLocalSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [savedParkingIds, setSavedParkingIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  // Pre-populate filters if navigated from home filter modal
  const [activeFilters, setActiveFilters] = useState(
    initialFilters ? JSON.parse(initialFilters) : {}
  );
  const isFocused = useIsFocused();

  // Count how many non-default filters are active
  const activeFilterCount = Object.values(activeFilters).filter(
    v => v && v !== 'distance' && v !== 'all' && v !== 'false'
  ).length;

  useEffect(() => {
    if (isFocused) {
      fetchSavedParkingIds();
    }
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getLastKnownPositionAsync() || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        if (loc && loc.coords) setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch (e) {
        // ignore location errors
      }
    })();
  }, []);

  const fetchSavedParkingIds = async () => {
    try {
      const data = await userService.getSavedParkings();
      setSavedParkingIds(data.map(p => p._id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleToggleBookmark = async (parkingId) => {
    if (!parkingId) return;
    try {
      await userService.toggleSavedParking(parkingId);
      setSavedParkingIds(prev => 
        prev.includes(parkingId) 
          ? prev.filter(id => id !== parkingId) 
          : [...prev, parkingId]
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await userService.getSearchHistory();
      setHistory(data);
    } catch (error) {
      console.error("Fetch history error:", error);
    }
  };

 
 
  const saveSearch = async (query) => {
    if (!query.trim()) return;
    try {
      await userService.addSearchHistory(query);
      fetchHistory(); // Refresh history
    } catch (error) {
      // Ignore
    }
  };

  const handleRemoveHistory = async (historyId) => {
    try {
      await userService.deleteSearchHistory(historyId);
      setHistory((prev) => prev.filter((item) => item._id !== historyId));
    } catch (error) {
      console.error('Remove history error:', error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // If user typed a query, search for it with active filters.
      if (searchQuery.trim() !== '') {
        // attach current location if available in filters
        executeSearch(searchQuery, activeFilters);
        return;
      }

      // No text query — if filters are active, fetch filtered results
      // (server will apply filters without q). Otherwise clear list.
      const hasFilters = activeFilters && Object.values(activeFilters).some(v => v && v !== 'all' && v !== 'distance' && v !== 'false');
      if (hasFilters) {
        executeSearch('', activeFilters);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeFilters]); // re-search when filters change too

  const executeSearch = async (query, filters = {}) => {
    try {
      setLoading(true);
      const lat = filters?.lat ?? filters?.latitude ?? userLocation?.latitude ?? null;
      const lng = filters?.lng ?? filters?.longitude ?? userLocation?.longitude ?? null;

      const [searchData] = await Promise.all([
        parkingService.searchParkings(query, { ...filters, lat, lng }),
      ]);

      setResults(searchData);
     

      if (searchData.length > 0) {
        saveSearch(query);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/parking-details', params: { parking: JSON.stringify(item) } })}
    >
      <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#3D3D3D' : COLORS.badgeBg }]}>
        <Ionicons name="car" size={20} color={isDarkMode ? '#FBD427' : COLORS.oliveDark} />
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.resultAddress, { color: theme.textLight }]}>{item.address || item.locationText}</Text>
      </View>
      <View style={styles.resultStats}>
        <TouchableOpacity 
          onPress={() => handleToggleBookmark(item._id)}
          style={{ marginBottom: 4 }}
        >
          <Ionicons 
            name={savedParkingIds.includes(item._id) ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>
        <Text style={[styles.resultDistance, { color: theme.textLight }]}>₹{item.pricePerHour || '—'}/hr</Text>
        <Text style={[styles.resultDistance, { color: theme.textLight }]}>{item.distanceText ?? ''}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFF' : COLORS.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Find Best Parking</Text>
        <Text style={[styles.subtext, { color: theme.textLight }]}>Enter your location to find them</Text>

        {/* Search Bar */}
        <View style={[styles.searchBarContainer, { borderColor: isDarkMode ? theme.border : '#A08A38', backgroundColor: theme.surface }]}>
          <Ionicons name="search" size={20} color={theme.text} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search location..."
            placeholderTextColor={theme.textLight}
            autoFocus={true}
          />
          {/* <TouchableOpacity style={[styles.filterBtn, { borderLeftColor: theme.border }]} onPress={() => setFilterVisible(true)}>
            <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? (isDarkMode ? '#FBD427' : COLORS.oliveDark) : theme.textLight} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity> */}
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : searchQuery.trim() === '' && activeFilterCount === 0 ? (
          /* Search History */
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Searches</Text>
            <FlatList
              data={history}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <View style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                  <TouchableOpacity 
                    style={styles.historyItem}
                    onPress={() => setSearchQuery(item.query)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="time-outline" size={18} color={theme.textLight} />
                    <Text style={[styles.historyText, { color: theme.text }]}>{item.query}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.historyRemoveBtn}
                    onPress={() => handleRemoveHistory(item._id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF4D4D" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={() => (
                <Text style={[styles.emptyText, { color: theme.textLight }]}>No recent searches</Text>
              )}
            />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            // ListHeaderComponent={renderRecommendation}
            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.border }]} />}
            ListEmptyComponent={() => (
              <Text style={[styles.emptyText, { color: theme.textLight }]}>
                {searchQuery.trim() !== ''
                  ? `No parkings found for "${searchQuery}"`
                  : 'No parkings match the selected filters'}
              </Text>
            )}
          />
        )}
      </View>

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilters}
      />
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
    borderColor: '#A08A38',
    borderRadius: SIZES.radius - 4,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 30,
  },
  filterBtn: {
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C4223',
    marginBottom: 15,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  historyItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 12,
  },
  historyText: {
    fontSize: 15,
    color: COLORS.text,
    flexShrink: 1,
    marginLeft: 12,
  },
  historyRemoveBtn: {
    padding: 12,
  },
  recommendationCard: {
    backgroundColor: '#FFF9E8',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    marginTop: 6,
    ...SHADOWS.light,
  },
  recommendationLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendationBadge: {
    color: COLORS.oliveDark,
    backgroundColor: '#FFF4D1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '700',
    fontSize: 12,
  },
  recommendationScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A6B00',
  },
  recommendationTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  recommendationSubtitle: {
    fontSize: SIZES.font,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  recommendationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  recommendationMeta: {
    fontSize: SIZES.font,
    color: '#7A6D4B',
    fontWeight: '600',
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    backgroundColor: '#F0E4C6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  reasonText: {
    fontSize: SIZES.font - 1,
    color: '#6A5C3C',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: 40,
    fontSize: 14,
  },
});
