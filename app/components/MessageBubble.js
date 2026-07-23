import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { formatTimestamp } from '../utils/helpers';

export const MessageBubble = ({ message, isMe }) => {
  return (
    <View style={[styles.wrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
      {isMe ? (
        <LinearGradient
          colors={['#6C6CFF', '#5555DD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.myBubble]}
        >
          <Text style={styles.myText}>{message.text}</Text>
          <View style={styles.footerRow}>
            <Text style={styles.myTime}>{formatTimestamp(message.timestamp)}</Text>
            <View style={styles.tagMy}>
              <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.7)" />
              <Text style={styles.tagMyText}>
                {message.hash ? `SHA256:${message.hash.substring(0, 5)}` : 'AES-256'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.theirBubble]}>
          <Text style={styles.theirText}>{message.text}</Text>
          <View style={styles.footerRow}>
            <Text style={styles.theirTime}>{formatTimestamp(message.timestamp)}</Text>
            <View style={styles.tagTheir}>
              <Ionicons name="shield-checkmark" size={10} color={colors.accent} />
              <Text style={styles.tagTheirText}>
                {message.hash ? `SHA256:${message.hash.substring(0, 5)}` : 'AES-256'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  myWrapper: {
    justifyContent: 'flex-end',
  },
  theirWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  myText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  theirText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  myTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  theirTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  tagMy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tagTheir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tagMyText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.8)',
  },
  tagTheirText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.accent,
  },
});
