import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, Clock, Briefcase } from 'lucide-react-native';
import { Job } from '../types';
import { StatusBadge } from './StatusBadge';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatDate } from '../utils/dateUtils';

interface HomeJobCardProps {
  job: Job;
  onPress: () => void;
}

export function HomeJobCard({ job, onPress }: HomeJobCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.92}
    >
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={styles.orderNum}>Job #{job.orderNumber}</Text>
          <View style={styles.metaRow}>
            <Briefcase size={13} color={COLORS.mutedForeground} />
            <Text style={styles.metaText}>{job.serviceType}</Text>
          </View>
          <View style={styles.dateRow}>
            <View style={styles.metaRow}>
              <Calendar size={13} color={COLORS.mutedForeground} />
              <Text style={styles.metaText}>{formatDate(job.date)}</Text>
            </View>
            <View style={[styles.metaRow, { marginLeft: 12 }]}>
              <Clock size={13} color={COLORS.mutedForeground} />
              <Text style={styles.metaText}>{job.time}</Text>
            </View>
          </View>
        </View>
        <StatusBadge status={job.status} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  orderNum: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.foreground,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.mutedForeground,
    lineHeight: 13,
    includeFontPadding: false,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
});
