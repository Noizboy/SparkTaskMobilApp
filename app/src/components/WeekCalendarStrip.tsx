import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { toDateString } from '../utils/dateUtils';

interface WeekCalendarStripProps {
  markedDates?: string[];
  onDayPress?: (date: string) => void;
}

export function WeekCalendarStrip({ markedDates = [], onDayPress }: WeekCalendarStripProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateString(today);

  const startOfCurrentWeek = new Date(today);
  startOfCurrentWeek.setDate(today.getDate() - today.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfCurrentWeek);
    d.setDate(startOfCurrentWeek.getDate() + i + weekOffset * 7);
    return d;
  });

  const displayMonth = weekDays[0].toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <View style={styles.container}>
      {/* Month nav */}
      <View style={styles.monthRow}>
        <Text style={styles.monthText}>{displayMonth}</Text>
        <View style={styles.navBtns}>
          {weekOffset > 0 && (
            <TouchableOpacity
              onPress={() => setWeekOffset((p) => p - 1)}
              style={styles.navBtn}
            >
              <ChevronLeft size={16} color={COLORS.mutedForeground} />
            </TouchableOpacity>
          )}
          {weekOffset > 0 && (
            <TouchableOpacity
              onPress={() => setWeekOffset(0)}
              style={styles.todayBtn}
            >
              <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setWeekOffset((p) => p + 1)}
            style={styles.navBtn}
          >
            <ChevronRight size={16} color={COLORS.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Days */}
      <View style={styles.daysRow}>
        {weekDays.map((date, idx) => {
          const dateStr = toDateString(date);
          const isToday = dateStr === todayStr;
          const hasMark = markedDates.includes(dateStr);
          const isPast = date < today;
          // Past days with jobs are still clickable (to view completed/scheduled orders)
          const isClickable = hasMark;

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => isClickable && onDayPress?.(dateStr)}
              disabled={!isClickable}
              style={[
                styles.dayCell,
                isToday && styles.dayCellToday,
                hasMark && !isToday && styles.dayCellMarked,
                !hasMark && !isToday && styles.dayCellEmpty,
              ]}
              activeOpacity={isClickable ? 0.75 : 1}
            >
              <Text
                style={[
                  styles.dayName,
                  isToday ? styles.dayNameToday : hasMark ? styles.dayNameMarked : styles.dayNameEmpty,
                ]}
              >
                {DAY_NAMES[idx]}
              </Text>
              <Text
                style={[
                  styles.dayNum,
                  isToday ? styles.dayNumToday : hasMark ? styles.dayNumMarked : styles.dayNumEmpty,
                ]}
              >
                {date.getDate()}
              </Text>
              {hasMark && (
                <View style={[styles.dot, { backgroundColor: isToday ? COLORS.white : COLORS.primary }]} />
              )}
              {!hasMark && <View style={styles.dotPlaceholder} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: SPACING.xl,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.mutedForeground,
  },
  navBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    padding: 4,
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.primary}10`,
  },
  todayText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.primary,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    gap: 2,
  },
  dayCellToday: {
    backgroundColor: COLORS.foreground,
  },
  dayCellMarked: {
    backgroundColor: COLORS.primaryContainer,
  },
  dayCellEmpty: {
    backgroundColor: COLORS.gray100,
  },
  dayName: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  dayNameToday: { color: 'rgba(255,255,255,0.7)' },
  dayNameMarked: { color: `${COLORS.primary}99` },
  dayNameEmpty: { color: COLORS.gray400 },
  dayNum: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
  },
  dayNumToday: { color: COLORS.white },
  dayNumMarked: { color: COLORS.primary },
  dayNumEmpty: { color: COLORS.foreground },
  dot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.full,
    marginTop: 2,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 2,
  },
});
