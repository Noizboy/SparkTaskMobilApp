import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { RootStackParamList } from '../types';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

type Route = RouteProp<RootStackParamList, 'JobCompleted'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function JobCompletedScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { jobs } = useApp();
  const { t } = useLanguage();

  const job = jobs.find((j) => j.id === route.params.jobId);
  if (!job) return null;

  const duration =
    job.startedAt && job.completedAt
      ? formatDuration(job.completedAt - job.startedAt)
      : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <CheckCircle2 size={56} color={COLORS.white} />
        </View>
        <Text style={styles.title}>{t('greatJob')}</Text>
        <Text style={styles.subtitle}>
          {t('youCompletedOrder')} #{job.orderNumber}
          {duration ? ` ${t('inTime')} ${duration}` : ''}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => {
          navigation.reset({
            index: 1,
            routes: [
              { name: 'MainTabs' },
              { name: 'OrderDetails', params: { jobId: job.id } },
            ],
          });
        }}
        style={styles.btn}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>{t('viewOrderDetails')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xxl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: COLORS.foreground,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.white,
  },
});
