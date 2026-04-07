import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Camera,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../types';
import { formatFullDate } from '../utils/dateUtils';

type Route = RouteProp<RootStackParamList, 'OrderDetails'>;

export function OrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { jobs } = useApp();
  const { t } = useLanguage();

  const job = jobs.find((j) => j.id === route.params.jobId);

  // If job is deleted or status changes away from completed externally (SSE), go home
  useEffect(() => {
    if (!job || job.status !== 'completed') {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }, [job?.status, job?.id]);

  if (!job) return null;

  const totalAddOns = job.addOns?.length ?? 0;
  const doneAddOns = job.addOns?.filter((a) => a.selected).length ?? 0;
  const totalTodos = job.sections.reduce((a, s) => a + s.todos.length, 0) + totalAddOns;
  const doneTodos = job.sections.reduce((a, s) => a + s.todos.filter((t) => t.completed).length, 0) + doneAddOns;
  const totalPhotos = job.sections.reduce(
    (a, s) => a + s.beforePhotos.length + s.afterPhotos.length,
    0
  );

  const getActualDuration = () => {
    if (!job.startedAt || !job.completedAt) return null;
    const totalMinutes = Math.round((job.completedAt - job.startedAt) / 60000);
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };
  const actualDuration = getActualDuration();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={COLORS.foreground} />
        </TouchableOpacity>
        <Text style={styles.topOrder}>Order #{job.orderNumber}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Title */}
        <View style={[styles.titleSection, job.status === 'completed' && { paddingBottom: 0 }]}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('status')}:</Text>
            <StatusBadge status={job.status} />
          </View>
          {job.status !== 'completed' && (
            <>
              <Text style={styles.clientName}>{job.clientName}</Text>
              <View style={styles.addressRow}>
                <MapPin size={13} color={COLORS.mutedForeground} />
                <Text style={styles.address}>{job.address}</Text>
              </View>
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
            </>
          )}
        </View>

        {/* Meta row */}
        <View style={styles.metaChips}>
          <MetaChip icon={<Calendar size={13} color={COLORS.white} />} text={formatFullDate(job.date)} />
          <MetaChip icon={<Clock size={13} color={COLORS.white} />} text={job.time} />
        </View>

        {/* Summary stats */}
        <View style={styles.statsRow}>
          <StatBox value={`${doneTodos}/${totalTodos}`} label={t('tasks')} />
          <StatBox value={actualDuration ?? job.duration} label={t('duration')} />
          <StatBox value={`${totalPhotos}`} label={t('photos')} />
        </View>

        {/* Sections */}
        <View style={styles.sectionsWrap}>
          <Text style={styles.sectionTitle}>{t('sections')}</Text>
          {job.sections.map((section) => {
            const allDone = section.todos.every((t) => t.completed);
            const skipped = !!section.skipReason;
            return (
              <View key={section.id} style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <View
                    style={[
                      styles.sectionStatus,
                      {
                        backgroundColor: skipped
                          ? COLORS.warningLight
                          : allDone
                          ? COLORS.primary
                          : COLORS.errorLight,
                      },
                    ]}
                  >
                    {skipped ? (
                      <XCircle size={16} color={COLORS.warning} />
                    ) : allDone ? (
                      <CheckCircle2 size={16} color={COLORS.white} />
                    ) : (
                      <XCircle size={16} color={COLORS.error} />
                    )}
                  </View>
                  <Text style={styles.sectionName}>{section.name}</Text>
                  <Text style={styles.sectionCount}>
                    {section.todos.filter((t) => t.completed).length}/{section.todos.length}
                  </Text>
                </View>

                {skipped && (
                  <View style={styles.skipReasonBox}>
                    <Text style={styles.skipReasonText}>{t('skipped')}: {section.skipReason}</Text>
                  </View>
                )}

                {/* Todos */}
                <View style={styles.todoList}>
                  {section.todos.map((todo) => (
                    <View key={todo.id} style={styles.todoRow}>
                      <CheckCircle2
                        size={14}
                        color={todo.completed ? COLORS.primary : COLORS.gray300}
                      />
                      <Text
                        style={[
                          styles.todoText,
                          !todo.completed && styles.todoTextIncomplete,
                        ]}
                      >
                        {todo.text}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Photos */}
                {(section.beforePhotos.length > 0 || section.afterPhotos.length > 0) && (
                  <View style={styles.photosSection}>
                    <PhotoStack label={t('before')} photos={section.beforePhotos} sectionName={section.name} />
                    <PhotoStack label={t('after')} photos={section.afterPhotos} sectionName={section.name} />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Add-ons */}
        {job.addOns && job.addOns.length > 0 && (
          <View style={styles.sectionsWrap}>
            <Text style={styles.sectionTitle}>{t('addOns')}</Text>
            <View style={styles.sectionCard}>
              {job.addOns.map((addon) => (
                <View key={addon.id} style={styles.addonRow}>
                  <CheckCircle2
                    size={15}
                    color={addon.selected ? COLORS.primary : COLORS.gray300}
                  />
                  <Text style={styles.addonName}>{addon.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MetaChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={metaStyles.chip}>
      {icon}
      <Text style={metaStyles.text}>{text}</Text>
    </View>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={statStyles.box}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

type PhotoRowNav = NativeStackNavigationProp<RootStackParamList>;

function PhotoStack({ label, photos, sectionName }: { label: string; photos: string[]; sectionName: string }) {
  const navigation = useNavigation<PhotoRowNav>();

  return (
    <TouchableOpacity
      style={photoStyles.stack}
      onPress={() => photos.length > 0 && navigation.navigate('PhotoGallery', { photos, label, sectionName })}
      activeOpacity={photos.length > 0 ? 0.85 : 1}
    >
      <View style={photoStyles.labelRow}>
        <Text style={photoStyles.label}>{label}</Text>
        {photos.length > 0 && (
          <View style={photoStyles.badge}>
            <Text style={photoStyles.badgeText}>{photos.length}</Text>
          </View>
        )}
      </View>
      {photos.length > 0 ? (
        <View style={photoStyles.imgWrap}>
          <Image source={{ uri: photos[0] }} style={photoStyles.img} />
          {photos.length > 1 && (
            <View style={photoStyles.overlay}>
              <Camera size={14} color={COLORS.white} />
              <Text style={photoStyles.overlayText}>+{photos.length}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={photoStyles.empty}>
          <Camera size={18} color={COLORS.gray300} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const metaStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.white,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 3,
    ...SHADOWS.sm,
  },
  value: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.foreground,
  },
  label: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.mutedForeground,
  },
});

const photoStyles = StyleSheet.create({
  stack: {
    flex: 1,
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.mutedForeground,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.white,
    includeFontPadding: false,
  },
  imgWrap: {
    position: 'relative',
  },
  img: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderTopLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  overlayText: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: COLORS.white,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  empty: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray100,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: SPACING.xl,
    gap: 4,
  },
  topOrder: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.foreground,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.foreground,
  },
  orderNum: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: COLORS.foreground,
  },
  clientName: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
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
  metaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xxl,
    gap: 8,
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xxl,
    gap: 8,
    marginBottom: SPACING.xl,
  },
  sectionsWrap: {
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.foreground,
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionStatus: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionName: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.foreground,
    flex: 1,
  },
  sectionCount: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.mutedForeground,
  },
  skipReasonBox: {
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  skipReasonText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#92400e',
  },
  todoList: {
    gap: 7,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todoText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.foreground,
    flex: 1,
  },
  todoTextIncomplete: {
    color: COLORS.gray400,
  },
  photosSection: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  addonName: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.foreground,
    flex: 1,
  },
  addonPrice: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    color: COLORS.primary,
  },
});
