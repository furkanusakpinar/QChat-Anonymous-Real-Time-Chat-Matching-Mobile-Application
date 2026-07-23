import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  icon,
  rightIcon,
  error,
  style,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.errorBorder : null]}>
        {icon && <View style={styles.leftIcon}>{icon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          style={[styles.input, inputStyle]}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 4,
  },
});
