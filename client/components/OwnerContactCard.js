import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../theme';

export default function OwnerContactCard({ ownerName, ownerAvatar }) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: ownerAvatar }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{ownerName}</Text>
        <Text style={styles.role}>Owner</Text>
      </View>
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="call-outline" size={24} color={COLORS.oliveDark} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.oliveDark} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EDCD', // Light yellow matching Image 2
    borderRadius: 14,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 110, // Gives scroll space so the bottom bar doesn't overlay this
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: '#4C4223',
    marginBottom: 4,
  },
  role: {
    fontSize: SIZES.medium,
    color: '#A0A0A0',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  }
});
