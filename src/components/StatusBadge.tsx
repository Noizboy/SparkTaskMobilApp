import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';

type Status = 'upcoming' | 'in-progress' | 'completed';

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage();
  const config = {
    upcoming: {
      bg: COLORS.primary,
      text: COLORS.white,
      label: t('upcoming'),
    },
    'in-progress': {
      bg: COLORS.warningLight,
      text: COLORS.warning,
      label: t('inProgressStatus'),
    },
    completed: {
      bg: '#000000',
      text: '#FFFFFF',
      label: t('completedStatus'),
    },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
