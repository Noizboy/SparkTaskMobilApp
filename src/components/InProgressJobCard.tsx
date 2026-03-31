import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, MapPin, ChevronRight } from 'lucide-react-native';
import { Job } from '../types';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface InProgressJobCardProps {
  job: Job;
  onPress: () => void;
  color?: string;
}

export function InProgressJobCard({ job, onPress, color = COLORS.pastelGreen }: InProgressJobCardProps) {
  const totalTodos = job.sections.reduce((acc, s) => acc + s.todos.length, 0);
  const completedTodos = job.sections.reduce(
    (acc, s) => acc + s.todos.filter((t) => t.completed).length,
    0
  );
  const progress = totalTodos > 0 ? completedTodos / totalTodos : 0;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, { backgroundColor: color }]} activeOpacity={0.9}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>In Progress</Text>
          <Text style={styles.orderNum}>Order #{job.orderNumber}</Text>
        </View>
        <View style={styles.chevronWrap}>
          <ChevronRight size={18} color={COLORS.primary} />
        </View>
      </View>

      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <Clock size={13} color={COLORS.primary} />
          <Text style={styles.metaText}>{job.time}</Text>
        </View>
        {job.status !== 'completed' && (
          <View style={styles.metaRow}>
            <MapPin size={13} color={COLORS.primary} />
            <Text style={styles.metaText} numberOfLines={1}>{job.address}</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {completedTodos}/{totalTodos} tasks
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.primary,
    opacity: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderNum: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.foreground,
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    gap: 4,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
  },
  progressWrap: {
    gap: 6,
  },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(4, 71, 40, 0.15)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  progressText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.primary,
    opacity: 0.75,
  },
});
