import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useStore } from '../redux/useStore';
import { CustomAlert } from './CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_CONFIG_KEY = 'QCHAT_FIREBASE_CONFIG';

export const FirebaseSetupModal = ({ visible, onClose }) => {
  const strings = useStore((s) => s.strings);
  const [configJson, setConfigJson] = useState('');
  const [status, setStatus] = useState('');
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', buttons: [], icon: undefined });

  const showAlert = (title, message, buttons, icon) => {
    setAlert({ visible: true, title, message, buttons, icon });
  };

  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  useEffect(() => {
    if (visible) loadExistingConfig();
  }, [visible]);

  const loadExistingConfig = async () => {
    try {
      const saved = await AsyncStorage.getItem(FIREBASE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfigJson(JSON.stringify(parsed, null, 2));
      } else {
        setConfigJson('');
      }
    } catch {
      setConfigJson('');
    }
  };

  const handleSave = async () => {
    setStatus('');
    const trimmed = configJson.trim();
    if (!trimmed) {
      setStatus(strings.firebase_modal_validation_empty);
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed.apiKey || !parsed.projectId) {
        setStatus(strings.firebase_modal_validation_fields);
        return;
      }
      await AsyncStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(parsed, null, 2));
      showAlert(
        strings.firebase_modal_saved_title,
        strings.firebase_modal_saved_desc,
        [{ text: strings.common_ok, onPress: () => { closeAlert(); onClose(); } }],
        'checkmark-circle'
      );
    } catch {
      setStatus(strings.firebase_modal_validation_invalid);
    }
  };

  const handleClear = async () => {
    await AsyncStorage.removeItem(FIREBASE_CONFIG_KEY);
    setConfigJson('');
    setStatus(strings.firebase_modal_reset_done);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={styles.sheetWrapper}>
          <Pressable style={styles.sheet}>
            <View style={styles.handleBar} />

            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{strings.firebase_modal_title}</Text>
                <Text style={styles.subtitle}>{strings.firebase_modal_subtitle}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{strings.firebase_modal_label}</Text>
            <TextInput
              style={styles.textArea}
              value={configJson}
              onChangeText={setConfigJson}
              placeholder={strings.firebase_modal_placeholder}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {status ? (
              <View style={styles.statusRow}>
                <Ionicons name="information-circle" size={14} color={colors.warning} />
                <Text style={styles.statusText}>{status}</Text>
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
                <Text style={styles.clearText}>{strings.firebase_modal_reset}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                <Text style={styles.saveText}>{strings.firebase_modal_save_restart}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </View>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        icon={alert.icon}
        onClose={closeAlert}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    width: '100%',
  },
  sheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 15,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 180,
    maxHeight: 260,
    lineHeight: 17,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  clearBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  saveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
});
