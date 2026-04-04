import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { CalendarClock, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useApp } from '../context/AppContext';
import { WeekCalendarStrip } from '../components/WeekCalendarStrip';
import { HomeJobCard } from '../components/HomeJobCard';
import { InProgressJobCard } from '../components/InProgressJobCard';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList, MainTabParamList } from '../types';
import { toDateString, isFutureOrToday } from '../utils/dateUtils';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabNav = BottomTabNavigationProp<MainTabParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const tabNavigation = useNavigation<TabNav>();
  const insets = useSafeAreaInsets();
  const { jobs, profileImage } = useApp();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inProgressJobs = jobs.filter((j) => j.status === 'in-progress');

  const allUpcomingJobs = jobs
    .filter((j) => j.status === 'upcoming' && isFutureOrToday(j.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const upcomingJobs = allUpcomingJobs.slice(0, 4);

  const allCompletedJobs = jobs
    .filter((j) => j.status === 'completed')
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const completedJobs = allCompletedJobs.slice(0, 4);

  const markedDates = [...inProgressJobs, ...upcomingJobs].map((j) => j.date);

  const handleJobPress = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    if (job.status === 'upcoming') navigation.navigate('JobInfo', { jobId });
    else if (job.status === 'in-progress') navigation.navigate('Checklist', { jobId });
    else navigation.navigate('OrderDetails', { jobId });
  };

  const handleDayPress = (date: string) => {
    navigation.navigate('DayJobs', { date });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => tabNavigation.navigate('Profile')} activeOpacity={0.85}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>S</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.name}>Welcome, Sarah</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => tabNavigation.navigate('Hub')}
              activeOpacity={0.7}
            >
              <CalendarClock size={20} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week calendar strip */}
        <View style={styles.section}>
          <WeekCalendarStrip markedDates={markedDates} onDayPress={handleDayPress} />
        </View>

        {/* In Progress */}
        {inProgressJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>In Progress</Text>
            <View style={styles.cardList}>
              {inProgressJobs.map((job) => (
                <InProgressJobCard
                  key={job.id}
                  job={job}
                  onPress={() => handleJobPress(job.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Upcoming */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllUpcomingJobs')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {upcomingJobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Calendar size={28} color={COLORS.gray400} />
              </View>
              <Text style={styles.emptyTitle}>No upcoming jobs at the moment</Text>
              <Text style={styles.emptyText}>You've completed your assigned schedule for today.</Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {upcomingJobs.map((job) => (
                <HomeJobCard key={job.id} job={job} onPress={() => handleJobPress(job.id)} />
              ))}
            </View>
          )}
        </View>

        {/* Completed */}
        {completedJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Completed</Text>
              {allCompletedJobs.length > 4 && (
                <TouchableOpacity onPress={() => navigation.navigate('AllCompletedJobs')} activeOpacity={0.7}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.cardList}>
              {completedJobs.map((job) => (
                <HomeJobCard key={job.id} job={job} onPress={() => handleJobPress(job.id)} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.foreground,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
  },
  avatarFallback: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.white,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 17,
    color: COLORS.foreground,
    marginBottom: 12,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
  },
  resetText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.gray600,
  },
  viewAllText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.primary,
  },
  cardList: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    ...SHADOWS.sm,
  },
  emptyIcon: {
    width: 60,
    height: 60,
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
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.mutedForeground,
    textAlign: 'center',
  },
});
