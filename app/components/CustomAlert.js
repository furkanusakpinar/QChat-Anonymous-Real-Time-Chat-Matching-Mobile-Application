import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

export const CustomAlert = ({ visible, title, message, buttons, onClose, icon }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {icon && (
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={28} color={colors.primary} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.buttonRow}>
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.btn, btn.style === 'cancel' && styles.btnCancel, btn.style === 'destructive' && styles.btnDestructive]}
                onPress={btn.onPress}
                activeOpacity={0.85}
              >
                {btn.primary ? (
                  <LinearGradient colors={['#6C6CFF', '#5555DD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
                    <Text style={styles.btnPrimaryText}>{btn.text}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.btnText, btn.style === 'destructive' && { color: colors.danger }]}>{btn.text}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(108,108,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  btnDestructive: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
