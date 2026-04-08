import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Briefcase,
  Key,
  Phone,
  Target,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../types';
import { formatFullDate } from '../utils/dateUtils';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'JobInfo'>;

export function JobInfoScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { jobs, startJob } = useApp();
  const { t } = useLanguage();

  const job = jobs.find((j) => j.id === route.params.jobId);

  // If job is deleted or status changed externally via SSE, go home
  useEffect(() => {
    if (!job || (job.status !== 'upcoming' && job.status !== 'in-progress')) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }, [job?.status, job?.id]);

  if (!job) return null;

  const inProgressJob = jobs.find((j) => j.status === 'in-progress' && j.id !== job.id);

  const handleStart = () => {
    if (inProgressJob) {
      Alert.alert(
        t('jobInProgress'),
        t('mustCompleteFirst', { orderNumber: inProgressJob.orderNumber }),
      );
      return;
    }
    startJob(job.id);
    navigation.replace('Checklist', { jobId: job.id });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={COLORS.foreground} />
        </TouchableOpacity>
        <StatusBadge status={job.status} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Title */}
        <View style={[styles.titleSection, job.status === 'completed' && { paddingBottom: 0 }]}>
          <Text style={styles.orderNum}>Order #{job.orderNumber}</Text>
          {job.status !== 'completed' && (
            <>
              <Text style={styles.clientName}>{job.clientName}</Text>
              {job.phone && (
                <TouchableOpacity
                  style={styles.phoneRow}
                  onPress={() => Linking.openURL(`tel:${job.phone}`)}
                  activeOpacity={0.7}
                >
                  <Phone size={14} color={COLORS.primary} />
                  <Text style={styles.phoneText}>{job.phone}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.addressRow}
                onPress={() => {
                  const encoded = encodeURIComponent(job.address);
                  const url = Platform.select({
                    ios: `maps:0,0?q=${encoded}`,
                    default: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
                  });
                  Linking.openURL(url);
                }}
                activeOpacity={0.7}
              >
                <MapPin size={14} color={COLORS.primary} />
                <Text style={[styles.address, styles.addressLink]}>{job.address}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Quick info chips */}
        <View style={styles.chipsRow}>
          <InfoChip icon={<Calendar size={13} color={COLORS.white} />} text={formatFullDate(job.date)} />
          <InfoChip icon={<Clock size={13} color={COLORS.white} />} text={job.time} />
          <InfoChip icon={<Briefcase size={13} color={COLORS.white} />} text={job.serviceType} />
          <InfoChip icon={<Clock size={13} color={COLORS.white} />} text={job.duration} />
        </View>

        {/* Details cards */}
        {job.goal && (
          <DetailCard
            icon={<Target size={17} color={COLORS.primary} />}
            title={t('goal')}
            content={job.goal}
          />
        )}

        {job.specialInstructions && (
          <DetailCard
            icon={<AlertCircle size={17} color={COLORS.warning} />}
            title={t('specialInstructions')}
            content={job.specialInstructions}
            accent={COLORS.warningLight}
          />
        )}

        {job.accessInfo && (
          <DetailCard
            icon={<Key size={17} color={COLORS.primary} />}
            title={t('accessInfo')}
            content={job.accessInfo}
          />
        )}

        {/* Sections preview */}
        <View style={styles.sectionPreview}>
          <Text style={styles.previewTitle}>{t('sections')} ({job.sections.length})</Text>
          <View style={styles.previewList}>
            {job.sections.map((section, i) => (
              <View key={section.id} style={styles.previewItem}>
                <View style={styles.previewNum}>
                  <Text style={styles.previewNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.previewItemName}>{section.name}</Text>
                <Text style={styles.previewItemTodos}>{section.todos.length} {t('tasks')}</Text>
                <ChevronRight size={14} color={COLORS.gray300} />
              </View>
            ))}
          </View>
        </View>

        {/* Add-ons preview */}
        {job.addOns && job.addOns.length > 0 && (
          <View style={styles.sectionPreview}>
            <Text style={styles.previewTitle}>{t('availableAddOns')} ({job.addOns.length})</Text>
            <View style={styles.addOnChips}>
              {job.addOns.map((addon) => (
                <View key={addon.id} style={styles.addOnChip}>
                  <Text style={styles.addOnName}>{addon.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Start Job Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity onPress={handleStart} style={styles.startBtn} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>{t('startJob')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={chipStyles.chip}>
      {icon}
      <Text style={chipStyles.text}>{text}</Text>
    </View>
  );
}

function DetailCard({
  icon,
  title,
  content,
  accent = COLORS.primaryContainer,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  accent?: string;
}) {
  return (
    <View style={[cardStyles.card, { backgroundColor: accent }]}>
      <View style={cardStyles.header}>
        {icon}
        <Text style={cardStyles.title}>{title}</Text>
      </View>
      <Text style={cardStyles.content}>{content}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.white,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

const cardStyles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.xxl,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    color: COLORS.foreground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.foreground,
    lineHeight: 21,
  },
});

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
  titleSection: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    gap: 4,
  },
  orderNum: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: COLORS.foreground,
  },
  clientName: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.mutedForeground,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  address: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.mutedForeground,
    flex: 1,
  },
  addressLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  phoneText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xxl,
    gap: 8,
    marginBottom: SPACING.xl,
  },
  sectionPreview: {
    marginHorizontal: SPACING.xxl,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  previewTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    color: COLORS.foreground,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewList: {
    gap: 8,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewNum: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNumText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.white,
  },
  previewItemName: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.foreground,
    flex: 1,
  },
  previewItemTodos: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.mutedForeground,
  },
  addOnChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addOnChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addOnName: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.foreground,
  },
  addOnPrice: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  startBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.white,
  },
});
