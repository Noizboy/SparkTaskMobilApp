import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { HomeJobCard } from '../components/HomeJobCard';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../types';
import { isFutureOrToday } from '../utils/dateUtils';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AllUpcomingJobsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { jobs } = useApp();

  const upcomingJobs = jobs.filter((j) => j.status === 'upcoming' && isFutureOrToday(j.date));

  const handleJobPress = (jobId: string) => {
    navigation.navigate('JobInfo', { jobId });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={COLORS.foreground} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Upcoming Jobs</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
      >
        <Text style={styles.subtitle}>
          {upcomingJobs.length} job{upcomingJobs.length !== 1 ? 's' : ''} scheduled
        </Text>

        {upcomingJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Calendar size={32} color={COLORS.gray400} />
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  topTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.foreground,
  },
  content: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.semibold,
    fontSize: 17,
    color: COLORS.foreground,
    marginBottom: 14,
  },
  cardList: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: 40,
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
    fontSize: 13,
    color: COLORS.mutedForeground,
    textAlign: 'center',
  },
});
