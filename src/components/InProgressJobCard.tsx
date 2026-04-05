import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { Timer } from 'lucide-react-native';
import { Job } from '../types';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatFullDate } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';

interface InProgressJobCardProps {
  job: Job;
  onPress: () => void;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function InProgressJobCard({ job, onPress }: InProgressJobCardProps) {
  const { t } = useLanguage();
  const totalTodos = job.sections.reduce((acc, s) => acc + s.todos.length, 0);
  const completedTodos = job.sections.reduce(
    (acc, s) => acc + s.todos.filter((t) => t.completed).length,
    0
  );
  const progress = totalTodos > 0 ? completedTodos / totalTodos : 0;
  const percentage = Math.round(progress * 100);

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.88}>
      <ImageBackground
        source={require('../images/inprogressbg.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      <View style={styles.body}>
        {/* Left column */}
        <View style={styles.left}>
          <Text style={styles.title}>{job.serviceType}</Text>
          <Text style={styles.status}>ORDER #: {job.orderNumber}</Text>
          <Text style={styles.scheduled}>{t('scheduledFor')}: {formatFullDate(job.date)}, {job.time}</Text>

          <View style={styles.progressInfo}>
              <Text style={styles.percentage}>{percentage}%</Text>
              <View>
                <Text style={styles.overallLabel}>{t('overallProgressLabel')}</Text>
                <Text style={styles.tasksText}>{completedTodos} {t('ofTasksCompleted', { total: String(totalTodos) })}</Text>
              </View>
            </View>
        </View>

        {/* Timer pill */}
        <View style={styles.timerPill}>
          <Timer size={20} color={COLORS.foreground} />
          <Text style={styles.timerLabel}>{t('timeElapsed')}</Text>
          <Text style={styles.timerText}>{formatElapsed(elapsed)}</Text>
        </View>
      </View>

      {/* Full width progress bar */}
      <View style={styles.progressBarWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  bgImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    opacity: 0.2,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.xl,
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.white,
    lineHeight: 26,
    marginBottom: 2,
  },
  status: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#c9b96e',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  scheduled: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 14,
  },
  progressBarWrap: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  percentage: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    color: COLORS.white,
    includeFontPadding: false,
    lineHeight: 40,
  },
  overallLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 16,
  },
  tasksText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 16,
  },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
  },
  timerPill: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
    minWidth: 90,
    ...SHADOWS.sm,
  },
  timerLabel: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.mutedForeground,
    marginTop: 2,
  },
  timerText: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.foreground,
    letterSpacing: 1,
    includeFontPadding: false,
  },
});
