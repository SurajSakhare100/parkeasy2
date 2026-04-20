import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, Image, TouchableOpacity,
  Dimensions, ScrollView, Text, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 260;

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&fit=crop',
  'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&fit=crop',
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&fit=crop',
  'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=800&fit=crop',
];

export default function DetailsHeaderCarousel({ 
  images = [], 
  isBookmarked = false, 
  onBookmarkPress,
  loadingBookmark = false 
}) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const safeImages = (images && images.length > 0) ? images : FALLBACK_IMAGES;

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Images */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        disableIntervalMomentum={true}
        snapToAlignment="center"
        nestedScrollEnabled={true}
      >
        {safeImages.map((uri, index) => (
          <Image
            key={index}
            source={{ uri }}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Gradient Overlay - pointerEvents="none" ensures it doesn't block scrolling */}
      <View style={styles.overlay} pointerEvents="none" />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backBtnBg}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </View>
      </TouchableOpacity>

      {/* Bookmark Button */}
      <TouchableOpacity 
        style={styles.bookmarkButton} 
        onPress={onBookmarkPress}
        disabled={loadingBookmark}
      >
        <View style={styles.bookmarkBtnBg}>
          {loadingBookmark ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={22} 
              color={isBookmarked ? COLORS.primary : "#333"} 
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Image Counter Badge */}
      <View style={styles.counterBadge}>
        <Ionicons name="images-outline" size={13} color="#FFF" />
        <Text style={styles.counterText}>{activeIndex + 1} / {safeImages.length}</Text>
      </View>

      {/* Pagination Dots */}
      <View style={styles.dotsContainer}>
        {safeImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CAROUSEL_HEIGHT,
    width: '100%',
    position: 'relative',
    backgroundColor: '#DDD',
  },
  image: {
    width,
    height: CAROUSEL_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  backButton: {
    position: 'absolute',
    top: 44,
    left: 16,
  },
  backBtnBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBadge: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  counterText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 44,
    right: 16,
  },
  bookmarkBtnBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 14,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 18,
    borderRadius: 3,
  },
});
