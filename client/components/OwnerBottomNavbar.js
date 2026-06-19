import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../theme';

const OwnerBottomNavbar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const focusedOptions = descriptors[state.routes[state.index].key].options;

  if (
    focusedOptions.tabBarStyle?.display === 'none' ||
    focusedOptions.href === null
  ) {
    return null;
  }

  const getIcon = (name, isFocused) => {
    switch (name) {
      case 'home':
        return isFocused ? 'home' : 'home-outline';

      case 'my-parkings':
        return isFocused ? 'car' : 'car-outline';

      case 'bookings':
        return isFocused ? 'list' : 'list-outline';

      case 'analytics':
        return isFocused
          ? 'stats-chart'
          : 'stats-chart-outline';

      case 'profile':
        return isFocused ? 'person' : 'person-outline';

      default:
        return 'square-outline';
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.navBar}>
        {state.routes.map((route, index) => {
          // Hide Scan tab completely
          if (route.name === 'scan') return null;

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

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={
                isFocused ? { selected: true } : {}
              }
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.navItem}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={getIcon(route.name, isFocused)}
                  size={22}
                  color={
                    isFocused
                      ? COLORS.oliveDark
                      : COLORS.textLight
                  }
                />
              </View>

              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused
                      ? COLORS.oliveDark
                      : COLORS.textLight,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>

              {isFocused && (
                <View style={styles.activeIndicator} />
              )}
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
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 64,
    ...SHADOWS.medium,
  },

  navItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});

export default OwnerBottomNavbar;