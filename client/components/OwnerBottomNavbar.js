import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../theme';

const OwnerBottomNavbar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const focusedOptions = descriptors[state.routes[state.index].key].options;

  // If the currently focused screen should hide the tab bar (e.g. details)
  if (focusedOptions.tabBarStyle?.display === 'none' || focusedOptions.href === null) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.navBar, { paddingBottom: Math.max(insets.bottom, 12), height: 60 + Math.max(insets.bottom, 12) }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          
          if (options.href === null || options.tabBarButton) {
            return null;
          }

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const getIcon = (name, isFocused) => {
            switch (name) {
              case 'home':
                return isFocused ? 'home' : 'home-outline';
              case 'my-parkings':
                return isFocused ? 'car' : 'car-outline';
              case 'bookings':
                return isFocused ? 'list' : 'list-outline';
              case 'analytics':
                return isFocused ? 'stats-chart' : 'stats-chart-outline';
              case 'profile':
                return isFocused ? 'person' : 'person-outline';
              default:
                return 'square-outline';
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.navItem}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                <Ionicons 
                  name={getIcon(route.name, isFocused)} 
                  size={22} 
                  color={isFocused ? COLORS.oliveDark : COLORS.textLight} 
                />
              </View>
              <Text style={[styles.label, { color: isFocused ? COLORS.oliveDark : COLORS.textLight, fontWeight: isFocused ? '700' : '500' }]}>
                {label}
              </Text>
              {isFocused && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    ...SHADOWS.medium,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    width: 42,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  activeIconContainer: {
    backgroundColor: COLORS.primary + '30',
  },
  label: {
    fontSize: 10,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.oliveDark,
  }
});

export default OwnerBottomNavbar;
