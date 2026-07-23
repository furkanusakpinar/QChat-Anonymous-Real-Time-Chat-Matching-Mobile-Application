import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES } from '../utils/countries';
import { colors } from '../theme/colors';
import { useStore } from '../redux/useStore';

export const CountryModal = ({ visible, onClose, onSelect }) => {
  const strings = useStore((s) => s.strings);
  const [search, setSearch] = useState('');

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{strings.country_modal_title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={strings.country_modal_search_placeholder}
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  onSelect(item.code);
                  onClose();
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.native}>{item.nativeName}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    marginLeft: 8,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  flag: {
    fontSize: 24,
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  native: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
