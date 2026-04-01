import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Camera,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
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

  const job = jobs.find((j) => j.id === route.params.jobId);
  if (!job) return null;

  const totalTodos = job.sections.reduce((a, s) => a + s.todos.length, 0);
  const doneTodos = job.sections.reduce((a, s) => a + s.todos.filter((t) => t.completed).length, 0);
  const selectedAddOns = job.addOns?.filter((a) => a.selected) ?? [];
  const totalPhotos = job.sections.reduce(
    (a, s) => a + s.beforePhotos.length + s.afterPhotos.length,
    0
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={COLORS.foreground} />
        </TouchableOpacity>
        <StatusBadge status={job.status} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Title */}
        <View style={[styles.titleSection, job.status === 'completed' && { paddingBottom: 0 }]}>
          <Text style={styles.orderNum}>Order #{job.orderNumber}</Text>
          {job.status !== 'completed' && (
            <>
              <Text style={styles.clientName}>{job.clientName}</Text>
              <View style={styles.addressRow}>
                <MapPin size={13} color={COLORS.mutedForeground} />
                <Text style={styles.address}>{job.address}</Text>
              </View>
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
          <StatBox value={`${doneTodos}/${totalTodos}`} label="Tasks" />
          <StatBox value={`${job.sections.length}`} label="Sections" />
          <StatBox value={`${selectedAddOns.length}`} label="Add-ons" />
          <StatBox value={`${totalPhotos}`} label="Photos" />
        </View>

        {/* Sections */}
        <View style={styles.sectionsWrap}>
          <Text style={styles.sectionTitle}>Sections</Text>
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
                    <Text style={styles.skipReasonText}>Skipped: {section.skipReason}</Text>
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
                    {section.beforePhotos.length > 0 && (
                      <PhotoRow label="Before" photos={section.beforePhotos} sectionName={section.name} />
                    )}
                    {section.afterPhotos.length > 0 && (
                      <PhotoRow label="After" photos={section.afterPhotos} sectionName={section.name} />
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Add-ons */}
        {job.addOns && job.addOns.length > 0 && (
          <View style={styles.sectionsWrap}>
            <Text style={styles.sectionTitle}>Add-ons</Text>
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

function PhotoRow({ label, photos, sectionName }: { label: string; photos: string[]; sectionName: string }) {
  const navigation = useNavigation<PhotoRowNav>();

  return (
    <View style={photoStyles.wrap}>
      <Text style={photoStyles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={photoStyles.row}>
          {photos.map((uri, i) => (
            <TouchableOpacity
              key={i}
              onPress={() =>
                navigation.navigate('PhotoGallery', { photos, label, sectionName })
              }
              activeOpacity={0.85}
            >
              <Image source={{ uri }} style={photoStyles.img} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
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
  wrap: {
    gap: 6,
    marginTop: 10,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.mutedForeground,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  img: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
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
    gap: 8,
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
