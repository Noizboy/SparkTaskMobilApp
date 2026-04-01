import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { CalendarX2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { HomeJobCard } from '../components/HomeJobCard';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../types';
import { toDateString } from '../utils/dateUtils';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CalendarScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { jobs } = useApp();

  const todayStr = toDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const markedDates: Record<string, any> = {};

  // One green dot per day that has at least one upcoming job, hidden when selected
  const jobsByDate: Record<string, typeof jobs> = {};
  jobs.forEach((job) => {
    if (!jobsByDate[job.date]) jobsByDate[job.date] = [];
    jobsByDate[job.date].push(job);
  });

  Object.entries(jobsByDate).forEach(([date, dayJobs]) => {
    const hasUpcoming = dayJobs.some((j) => j.status === 'upcoming');
    const hasInProgress = dayJobs.some((j) => j.status === 'in-progress');
    const allCompleted = dayJobs.every((j) => j.status === 'completed');
    if (date === selectedDate) return;
    if (hasUpcoming) {
      markedDates[date] = { marked: true, dotColor: COLORS.success };
    } else if (hasInProgress) {
      markedDates[date] = { marked: true, dotColor: COLORS.warning };
    } else if (allCompleted) {
      markedDates[date] = { marked: true, dotColor: COLORS.black };
    }
  });

  // Highlight selected date, no dot
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: COLORS.primary,
    marked: false,
  };

  const jobsForDay = jobs.filter((j) => j.date === selectedDate);

  const handleJobPress = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    if (job.status === 'upcoming') navigation.navigate('JobInfo', { jobId });
    else if (job.status === 'in-progress') navigation.navigate('Checklist', { jobId });
    else navigation.navigate('OrderDetails', { jobId });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
        </View>

        {/* Calendar */}
        <View style={[styles.calendarWrap]}>
          <Calendar
            current={todayStr}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markingType="dot"
            markedDates={markedDates}
            theme={{
              backgroundColor: COLORS.white,
              calendarBackground: COLORS.white,
              todayTextColor: COLORS.primary,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.white,
              dayTextColor: COLORS.foreground,
              textDisabledColor: COLORS.gray300,
              monthTextColor: COLORS.foreground,
              arrowColor: COLORS.primary,
              dotColor: COLORS.primary,
              textDayFontFamily: FONTS.regular,
              textMonthFontFamily: FONTS.semibold,
              textDayHeaderFontFamily: FONTS.medium,
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
        </View>

        {/* Jobs for day */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {selectedDate === todayStr ? "Today's Jobs" : `Jobs on ${selectedDate}`}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{jobsForDay.length} Total</Text>
            </View>
          </View>

          {jobsForDay.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <CalendarX2 size={28} color={COLORS.gray400} />
              </View>
              <Text style={styles.emptyTitle}>No jobs scheduled for this day</Text>
              <Text style={styles.emptyText}>Check back later or browse available openings.</Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {jobsForDay.map((job) => (
                <HomeJobCard key={job.id} job={job} onPress={() => handleJobPress(job.id)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.foreground,
  },
  calendarWrap: {
    marginHorizontal: SPACING.xxl,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  listSection: {
    paddingHorizontal: SPACING.xxl,
    marginTop: SPACING.xxl,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  listTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 17,
    color: COLORS.foreground,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.white,
    includeFontPadding: false,
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: 8,
    ...SHADOWS.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.foreground,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.mutedForeground,
    textAlign: 'center',
  },
  cardList: {
    gap: 10,
  },
});
