import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Switch, PanResponder, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../theme';

// Simple interactive slider built with PanResponder (no extra lib needed)
function Slider({ min, max, value, onChange, formatLabel }) {
  const [trackWidth, setTrackWidth] = useState(1);
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));

  const pan = React.useRef(new Animated.Value(0)).current;

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { pan.setOffset(pct * trackWidth); pan.setValue(0); },
    onPanResponderMove: (_, { dx }) => pan.setValue(dx),
    onPanResponderRelease: (_, { dx }) => {
      const newPct = Math.min(1, Math.max(0, (pct * trackWidth + dx) / trackWidth));
      const newVal = Math.round(min + newPct * (max - min));
      onChange(newVal);
      pan.flattenOffset();
    },
  });

  const knobLeft = pct * (trackWidth - 24); // 24 = knob size

  return (
    <View
      style={styles.sliderTrack}
      onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {/* filled part */}
      <View style={[styles.sliderFill, { width: `${pct * 100}%` }]} />
      {/* knob */}
      <View
        {...responder.panHandlers}
        style={[styles.sliderKnob, { left: knobLeft }]}
      >
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{formatLabel(value)}</Text>
        </View>
      </View>
    </View>
  );
}

const SORT_OPTIONS = [
  { label: 'Distance',    value: 'distance' },
  { label: 'Price ↑',    value: 'price_asc' },
  { label: 'Price ↓',    value: 'price_desc' },
  { label: 'Slots',      value: 'slots' },
];

export default function FilterModal({ visible, onClose, onApply }) {
  const [sortBy, setSortBy]               = useState('distance');
  const [maxPrice, setMaxPrice]           = useState(200);
  const [vehicleType, setVehicleType]     = useState('all');
  const [availableOnly, setAvailableOnly] = useState(false);

  const handleReset = () => {
    setSortBy('distance');
    setMaxPrice(200);
    setVehicleType('all');
    setAvailableOnly(false);
  };

  const handleApply = () => {
    const filters = {
      sortBy,
      maxPrice,
      vehicleType,
      availableOnly: availableOnly ? 'true' : 'false',
    };
    if (onApply) onApply(filters);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>Filter & Sort</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* ── Sort By ──────────────────────────────── */}
          <Text style={styles.sectionLabel}>Sort by</Text>
          <View style={styles.pills}>
            {SORT_OPTIONS.map(opt => {
              const active = sortBy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSortBy(opt.value)}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Max Price ─────────────────────────────── */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionLabel}>Max Price</Text>
            <Text style={styles.valueTag}>₹{maxPrice}/hr</Text>
          </View>
          <Slider
            min={20} max={500}
            value={maxPrice}
            onChange={setMaxPrice}
            formatLabel={v => `₹${v}`}
          />

          {/* ── Vehicle Type ──────────────────────────── */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Vehicle Type</Text>
          <View style={styles.pills}>
            {['all', 'car', 'bike'].map(v => {
              const active = vehicleType === v;
              const icon = v === 'car' ? 'car-outline' : v === 'bike' ? 'bicycle-outline' : 'layers-outline';
              return (
                <TouchableOpacity
                  key={v}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setVehicleType(v)}
                >
                  <Ionicons name={icon} size={14} color={active ? '#333' : '#888'} style={{ marginRight: 4 }} />
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Available Only ────────────────────────── */}
          <View style={[styles.rowBetween, { marginTop: 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.toggleText}>Available spots only</Text>
            </View>
            <Switch
              value={availableOnly}
              onValueChange={setAvailableOnly}
              trackColor={{ false: '#767577', true: COLORS.primaryDark }}
              thumbColor={availableOnly ? COLORS.primary : '#f4f3f4'}
            />
          </View>

          {/* ── Buttons ───────────────────────────────── */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnApply} onPress={handleApply}>
              <Text style={styles.btnApplyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingBottom: 32,
    ...SHADOWS.medium,
  },
  handle: {
    width: 40, height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: '#333',
  },
  resetText: {
    fontSize: SIZES.font,
    color: COLORS.oliveDark,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    color: '#444',
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueTag: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: { fontSize: SIZES.font, color: '#888' },
  pillTextActive: { color: '#333', fontWeight: '700' },
  // Slider
  sliderTrack: {
    height: 6,
    backgroundColor: '#EAEAEA',
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  sliderKnob: {
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: COLORS.primary,
    position: 'absolute',
    top: -9,
    ...SHADOWS.light,
  },
  tooltip: {
    position: 'absolute',
    top: -28,
    left: -10,
    backgroundColor: COLORS.oliveDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tooltipText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  // Toggles
  toggleText: {
    fontSize: SIZES.medium,
    color: '#555',
    marginLeft: 12,
  },
  // Buttons
  btnRow: { flexDirection: 'row', marginTop: 28, gap: 12 },
  btnCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnCancelText: { fontSize: SIZES.medium, color: '#888', fontWeight: '600' },
  btnApply: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnApplyText: { fontSize: SIZES.medium, color: '#333', fontWeight: 'bold' },
});
