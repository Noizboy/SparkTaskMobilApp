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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { HomeJobCard } from '../components/HomeJobCard';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../types';
import { formatFullDate } from '../utils/dateUtils';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'DayJobs'>;

export function DayJobsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { jobs } = useApp();
  const { t } = useLanguage();

  const { date } = route.params;
  const dayJobs = jobs.filter((j) => j.date === date);

  const handleJobPress = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    if (job.status === 'upcoming') navigation.navigate('JobInfo', { jobId });
    else if (job.status === 'in-progress') navigation.navigate('Checklist', { jobId });
    else navigation.navigate('OrderDetails', { jobId });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={COLORS.foreground} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Calendar size={16} color={COLORS.primary} />
          <Text style={styles.topDate}>{formatFullDate(date)}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
      >
        <Text style={styles.title}>
          {dayJobs.length} {dayJobs.length !== 1 ? t('jobsScheduled') : t('jobScheduled')}
        </Text>

        {dayJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Calendar size={32} color={COLORS.gray400} />
            </View>
            <Text style={styles.emptyTitle}>{t('noJobsForDay')}</Text>
            <Text style={styles.emptyText}>{t('nothingScheduledHere')}</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {dayJobs.map((job) => (
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
  topCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topDate: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.primary,
  },
  content: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.sm,
  },
  title: {
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
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.mutedForeground,
  },
});
