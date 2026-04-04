import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  Briefcase,
  Clock,
  CalendarCheck,
  LogIn,
  LogOut,
  TrendingUp,
  Camera,
  Flame,
  CheckCircle2,
  Ban,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList, Job } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Period = 'week' | 'month' | 'all';

// ── Helpers ──────────────────────────────────────────────

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getWeekStart(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); // Monday
  return date;
}

function getMonthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}


// ── Component ────────────────────────────────────────────

export function HubScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { jobs } = useApp();
  const [period, setPeriod] = useState<Period>('week');

  const now = new Date();
  const weekStart = getWeekStart(now);
  const monthStart = getMonthStart(now);
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 86400000);

  const allCompleted = useMemo(
    () => jobs.filter((j) => j.status === 'completed' && j.startedAt && j.completedAt),
    [jobs],
  );

  // Filter by period
  const filtered = useMemo(() => {
    if (period === 'all') return allCompleted;
    const start = period === 'week' ? weekStart.getTime() : monthStart.getTime();
    return allCompleted.filter((j) => j.startedAt! >= start);
  }, [allCompleted, period]);

  const lastWeekJobs = useMemo(
    () => allCompleted.filter((j) => j.startedAt! >= lastWeekStart.getTime() && j.startedAt! < weekStart.getTime()),
    [allCompleted],
  );

  // ── Stats ──
  const totalCompleted = filtered.length;
  const totalMs = filtered.reduce((a, j) => a + (j.completedAt! - j.startedAt!), 0);
  const totalHours = totalMs / 3600000;
  const avgMs = totalCompleted > 0 ? totalMs / totalCompleted : 0;

  // Photos
  const totalPhotos = filtered.reduce(
    (a, j) => a + j.sections.reduce((b, s) => b + s.beforePhotos.length + s.afterPhotos.length, 0), 0,
  );

  // Completion rate
  const completionRate = useMemo(() => {
    if (filtered.length === 0) return 0;
    const fullyCompleted = filtered.filter((j) =>
      j.sections.every((s) => s.skipReason || s.todos.every((t) => t.completed)),
    ).length;
    return Math.round((fullyCompleted / filtered.length) * 100);
  }, [filtered]);

  // Streak
  const streak = useMemo(() => {
    if (allCompleted.length === 0) return 0;
    const dates = [...new Set(allCompleted.map((j) => new Date(j.startedAt!).toISOString().split('T')[0]))].sort().reverse();
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let check = new Date(today);
    // Allow today or yesterday as starting point
    const todayStr = check.toISOString().split('T')[0];
    if (!dates.includes(todayStr)) {
      check.setDate(check.getDate() - 1);
    }
    for (let i = 0; i < 365; i++) {
      const str = check.toISOString().split('T')[0];
      if (dates.includes(str)) {
        count++;
        check.setDate(check.getDate() - 1);
      } else break;
    }
    return count;
  }, [allCompleted]);

  // Weekly comparison
  const thisWeekMs = useMemo(
    () => filtered.filter((j) => period === 'week' ? true : j.startedAt! >= weekStart.getTime())
      .reduce((a, j) => a + (j.completedAt! - j.startedAt!), 0),
    [filtered, period],
  );
  const lastWeekMs = lastWeekJobs.reduce((a, j) => a + (j.completedAt! - j.startedAt!), 0);
  const weekDiffPct = lastWeekMs > 0 ? Math.round(((thisWeekMs - lastWeekMs) / lastWeekMs) * 100) : null;


  // Most skipped sections
  const skippedSections = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((j) =>
      j.sections.forEach((s) => {
        if (s.skipReason) counts[s.name] = (counts[s.name] || 0) + 1;
      }),
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [filtered]);

  // Clock entries grouped by date
  const dateGroups = useMemo(() => {
    const entries = filtered.map((j) => ({
      date: new Date(j.startedAt!).toISOString().split('T')[0],
      clockIn: j.startedAt!,
      clockOut: j.completedAt!,
      orderNumber: j.orderNumber,
      duration: j.completedAt! - j.startedAt!,
    })).sort((a, b) => b.clockIn - a.clockIn);

    const grouped: Record<string, typeof entries> = {};
    entries.forEach((e) => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    return Object.entries(grouped);
  }, [filtered]);

  // Active job & next job
  const activeJob = jobs.find((j) => j.status === 'in-progress' && j.startedAt);
  const nextJob = useMemo(() => {
    const upcoming = jobs
      .filter((j) => j.status === 'upcoming')
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    return upcoming[0] ?? null;
  }, [jobs]);

  // ── Period tabs ──
  const PERIODS: { key: Period; label: string }[] = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Hub</Text>
        <Text style={s.headerSub}>Your work overview</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Active clock-in */}
        {activeJob && (
          <View style={s.activeBanner}>
            <View style={s.activeDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.activeTitle}>Clocked In</Text>
              <Text style={s.activeSub}>
                Order #{activeJob.orderNumber} since {formatTime(activeJob.startedAt!)}
              </Text>
            </View>
            <LogIn size={20} color={COLORS.primary} />
          </View>
        )}

        {/* Next job */}
        {!activeJob && nextJob && (
          <TouchableOpacity
            style={s.nextJobCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('JobInfo', { jobId: nextJob.id })}
          >
            <View style={s.nextJobIcon}>
              <CalendarCheck size={18} color={COLORS.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nextJobLabel}>Next Job</Text>
              <Text style={s.nextJobTitle}>Order #{nextJob.orderNumber} · {nextJob.time}</Text>
              <View style={s.nextJobAddress}>
                <MapPin size={10} color={COLORS.mutedForeground} />
                <Text style={s.nextJobAddressText} numberOfLines={1}>{nextJob.address}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.mutedForeground} />
          </TouchableOpacity>
        )}

        {/* Period filter */}
        <View style={s.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[s.periodTab, period === p.key && s.periodTabActive]}
              activeOpacity={0.7}
            >
              <Text style={[s.periodText, period === p.key && s.periodTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats grid */}
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <View style={s.statIcon}>
              <Briefcase size={16} color={COLORS.white} />
            </View>
            <Text style={s.statValue}>{totalCompleted}</Text>
            <Text style={s.statLabel}>Jobs Done</Text>
          </View>
          <View style={s.statCard}>
            <View style={s.statIcon}>
              <Clock size={16} color={COLORS.white} />
            </View>
            <Text style={s.statValue}>{totalHours.toFixed(1)}h</Text>
            <Text style={s.statLabel}>Hours</Text>
          </View>
          <View style={s.statCard}>
            <View style={s.statIcon}>
              <TrendingUp size={16} color={COLORS.white} />
            </View>
            <Text style={s.statValue}>{avgMs > 0 ? formatDuration(avgMs) : '--'}</Text>
            <Text style={s.statLabel}>Avg / Job</Text>
          </View>
          <View style={s.statCard}>
            <View style={s.statIcon}>
              <Camera size={16} color={COLORS.white} />
            </View>
            <Text style={s.statValue}>{totalPhotos}</Text>
            <Text style={s.statLabel}>Photos</Text>
          </View>
        </View>

        {/* Highlights row */}
        <View style={s.highlightsRow}>
          <View style={s.highlightCard}>
            <Flame size={16} color={COLORS.warning} />
            <Text style={s.highlightValue}>{streak}d</Text>
            <Text style={s.highlightLabel}>Streak</Text>
          </View>
          <View style={s.highlightCard}>
            <CheckCircle2 size={16} color={COLORS.primary} />
            <Text style={s.highlightValue}>{completionRate}%</Text>
            <Text style={s.highlightLabel}>Complete Rate</Text>
          </View>
          {weekDiffPct !== null && (
            <View style={s.highlightCard}>
              <TrendingUp size={16} color={weekDiffPct >= 0 ? COLORS.primary : COLORS.error} />
              <Text style={[s.highlightValue, weekDiffPct < 0 && { color: COLORS.error }]}>
                {weekDiffPct >= 0 ? '+' : ''}{weekDiffPct}%
              </Text>
              <Text style={s.highlightLabel}>vs Last Week</Text>
            </View>
          )}
        </View>


        {/* Skipped sections */}
        {skippedSections.length > 0 && (
          <View style={s.skippedCard}>
            <Text style={s.skippedTitle}>Most Skipped Sections</Text>
            {skippedSections.map(([name, count]) => (
              <View key={name} style={s.skippedRow}>
                <Ban size={13} color={COLORS.warning} />
                <Text style={s.skippedName}>{name}</Text>
                <Text style={s.skippedCount}>{count}x</Text>
              </View>
            ))}
          </View>
        )}

        {/* Clock history */}
        <View style={s.historySection}>
          <Text style={s.sectionTitle}>Clock History</Text>
          {dateGroups.length === 0 ? (
            <View style={s.emptyCard}>
              <Clock size={32} color={COLORS.gray300} />
              <Text style={s.emptyText}>No clock entries yet</Text>
              <Text style={s.emptySub}>Start and complete a job to see your history</Text>
            </View>
          ) : (
            dateGroups.map(([date, entries]) => {
              const dayTotal = entries.reduce((a, e) => a + e.duration, 0);
              return (
                <View key={date} style={s.dayCard}>
                  <View style={s.dayHeader}>
                    <Text style={s.dayLabel}>{formatDateLabel(date)}</Text>
                    <View style={s.dayTotalPill}>
                      <Clock size={11} color={COLORS.white} />
                      <Text style={s.dayTotalText}>{formatDuration(dayTotal)}</Text>
                    </View>
                  </View>
                  {entries.map((entry, i) => (
                    <View key={i} style={[s.entryRow, i < entries.length - 1 && s.entryBorder]}>
                      <Text style={s.entryOrder}>#{entry.orderNumber}</Text>
                      <View style={s.entryPills}>
                        <View style={s.pillIn}>
                          <LogIn size={10} color={COLORS.white} />
                          <Text style={s.pillInText}>{formatTime(entry.clockIn)}</Text>
                        </View>
                        <View style={s.pillOut}>
                          <LogOut size={10} color={COLORS.mutedForeground} />
                          <Text style={s.pillOutText}>{formatTime(entry.clockOut)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xxl, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.foreground },
  headerSub: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.mutedForeground, marginTop: 2 },

  // Active banner
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: SPACING.xxl, marginBottom: SPACING.lg, padding: SPACING.lg,
    backgroundColor: COLORS.primaryContainer, borderRadius: RADIUS.xxl,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  activeDot: { width: 10, height: 10, borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  activeTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.primary },
  activeSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.foreground, marginTop: 1 },

  // Next job
  nextJobCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: SPACING.xxl, marginBottom: SPACING.lg, padding: SPACING.lg,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xxl, ...SHADOWS.sm,
  },
  nextJobIcon: {
    width: 40, height: 40, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  nextJobLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.mutedForeground },
  nextJobTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.foreground, marginTop: 1 },
  nextJobAddress: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  nextJobAddressText: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.mutedForeground, flex: 1 },

  // Period filter
  periodRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: SPACING.xxl, marginBottom: SPACING.lg,
  },
  periodTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full, backgroundColor: COLORS.gray100,
  },
  periodTabActive: { backgroundColor: COLORS.primary },
  periodText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.mutedForeground },
  periodTextActive: { color: COLORS.white },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: SPACING.xxl, marginBottom: SPACING.md,
  },
  statCard: {
    width: '47%', flexGrow: 1,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xxl,
    padding: SPACING.lg, gap: 4, ...SHADOWS.sm,
  },
  statIcon: {
    width: 32, height: 32, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.foreground },
  statLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.mutedForeground },

  // Highlights
  highlightsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: SPACING.xxl, marginBottom: SPACING.lg,
  },
  highlightCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.md, alignItems: 'center', gap: 4, ...SHADOWS.sm,
  },
  highlightValue: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.foreground },
  highlightLabel: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.mutedForeground, textAlign: 'center' },


  // Skipped sections
  skippedCard: {
    marginHorizontal: SPACING.xxl, marginBottom: SPACING.lg,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xxl,
    padding: SPACING.lg, ...SHADOWS.sm,
  },
  skippedTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.foreground, marginBottom: SPACING.md },
  skippedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6,
  },
  skippedName: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.foreground, flex: 1 },
  skippedCount: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.warning },

  // History section
  historySection: { paddingHorizontal: SPACING.xxl },
  sectionTitle: { fontFamily: FONTS.semibold, fontSize: 17, color: COLORS.foreground, marginBottom: SPACING.lg },
  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xxl,
    alignItems: 'center', paddingVertical: 40, gap: 8, ...SHADOWS.sm,
  },
  emptyText: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.foreground },
  emptySub: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.mutedForeground, textAlign: 'center' },

  // Day cards
  dayCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xxl,
    marginBottom: SPACING.md, overflow: 'hidden', ...SHADOWS.sm,
  },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  dayLabel: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.foreground },
  dayTotalPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.foreground, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  dayTotalText: {
    fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.white,
    includeFontPadding: false, textAlignVertical: 'center',
  },
  entryRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: 6 },
  entryBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  entryOrder: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.foreground },
  entryPills: { flexDirection: 'row', gap: 8 },
  pillIn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  pillInText: {
    fontFamily: FONTS.medium, fontSize: 11, color: COLORS.white,
    includeFontPadding: false, textAlignVertical: 'center',
  },
  pillOut: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.gray200, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  pillOutText: {
    fontFamily: FONTS.medium, fontSize: 11, color: COLORS.mutedForeground,
    includeFontPadding: false, textAlignVertical: 'center',
  },
});
