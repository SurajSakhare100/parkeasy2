import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../theme';

export default function FilterModal({ visible, onClose, onApply }) {
  const [activeSort, setActiveSort] = useState('Distance');
  const [dealsEnabled, setDealsEnabled] = useState(true);
  const [highestRatedEnabled, setHighestRatedEnabled] = useState(false);

  const sortOptions = ['Distance', 'Slot Available', 'Price', 'High Ratings', 'Parking Time'];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeHandle} onPress={onClose} />
          
          <Text style={styles.title}>Sort by</Text>
          
          <View style={styles.pillsContainer}>
            {sortOptions.map(option => {
              const isActive = activeSort === option;
              return (
                <TouchableOpacity 
                  key={option} 
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => setActiveSort(option)}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{option}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Distance Slider Mock */}
          <Text style={styles.sectionTitle}>Distance</Text>
          <View style={styles.sliderMockContainer}>
            <View style={styles.sliderLine} />
            <View style={[styles.sliderLineActive, { width: '60%' }]} />
            <View style={[styles.sliderKnob, { left: '60%' }]}>
              <View style={styles.sliderTooltip}>
                <Text style={styles.tooltipText}>500m</Text>
              </View>
            </View>
          </View>

          {/* Price Slider Mock */}
          <Text style={styles.sectionTitle}>Price</Text>
          <View style={styles.sliderMockContainer}>
            <View style={styles.sliderLine} />
            <View style={[styles.sliderLineActive, { width: '30%' }]} />
            <View style={[styles.sliderKnob, { left: '30%' }]}>
              <View style={styles.sliderTooltip}>
                <Text style={styles.tooltipText}>₹30</Text>
              </View>
            </View>
          </View>

          {/* Toggles */}
          <Text style={styles.fromTitle}>From ParkEasy <Ionicons name="car" size={18} color={COLORS.oliveDark}/></Text>
          
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.toggleText}>Deals</Text>
            </View>
            <Switch
              value={dealsEnabled}
              onValueChange={setDealsEnabled}
              trackColor={{ false: '#767577', true: COLORS.primaryDark }}
              thumbColor={dealsEnabled ? COLORS.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Ionicons name="medal-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.toggleText}>Highest rated</Text>
            </View>
            <Switch
              value={highestRatedEnabled}
              onValueChange={setHighestRatedEnabled}
              trackColor={{ false: '#767577', true: COLORS.primaryDark }}
              thumbColor={highestRatedEnabled ? COLORS.primary : '#f4f3f4'}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.btnApply} 
              onPress={() => {
                if (onApply) {
                  onApply({ activeSort, dealsEnabled, highestRatedEnabled });
                }
                onClose();
              }}
            >
              <Text style={styles.btnApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    paddingTop: 15,
  },
  closeHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  pill: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: SIZES.font,
    color: '#888',
  },
  pillTextActive: {
    color: '#333',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 25,
  },
  sliderMockContainer: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  sliderLine: {
    height: 4,
    backgroundColor: '#EAEAEA',
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
  },
  sliderLineActive: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    position: 'absolute',
  },
  sliderKnob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.oliveDark,
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  sliderTooltip: {
    position: 'absolute',
    top: -25,
    left: -15,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tooltipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  fromTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: SIZES.medium,
    color: '#555',
    marginLeft: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  btnCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  btnCancelText: {
    fontSize: SIZES.medium,
    color: '#888',
    fontWeight: '600',
  },
  btnApply: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnApplyText: {
    fontSize: SIZES.medium,
    color: '#333',
    fontWeight: 'bold',
  }
});
