import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, RADIUS } from '../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = RADIUS.md, style }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: COLORS.gray200,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[sk.card, style]}>
      <View style={sk.cardRow}>
        <Skeleton width={40} height={40} borderRadius={RADIUS.full} />
        <View style={sk.cardContent}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton width="90%" height={12} style={{ marginTop: 12 }} />
      <Skeleton width="70%" height={12} style={{ marginTop: 6 }} />
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View style={sk.container}>
      {/* Header */}
      <View style={sk.headerRow}>
        <View style={sk.headerLeft}>
          <Skeleton width={40} height={40} borderRadius={RADIUS.full} />
          <Skeleton width={150} height={22} />
        </View>
        <Skeleton width={40} height={40} borderRadius={RADIUS.full} />
      </View>

      {/* Calendar strip */}
      <View style={sk.calendarStrip}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={sk.calendarDay}>
            <Skeleton width={28} height={10} />
            <Skeleton width={36} height={36} borderRadius={RADIUS.full} />
          </View>
        ))}
      </View>

      {/* Section title */}
      <Skeleton width={130} height={17} style={{ marginTop: 24, marginBottom: 12 }} />

      {/* Job cards */}
      <SkeletonCard />
      <SkeletonCard style={{ marginTop: 10 }} />
      <SkeletonCard style={{ marginTop: 10 }} />
    </View>
  );
}

export function CalendarScreenSkeleton() {
  return (
    <View style={sk.container}>
      {/* Title */}
      <Skeleton width={120} height={24} style={{ marginBottom: 16 }} />

      {/* Calendar placeholder */}
      <View style={sk.calendarBox}>
        <Skeleton width="50%" height={16} style={{ alignSelf: 'center', marginBottom: 16 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={sk.calendarRow}>
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} width={32} height={32} borderRadius={RADIUS.full} />
            ))}
          </View>
        ))}
      </View>

      {/* Job list */}
      <Skeleton width={130} height={17} style={{ marginTop: 24, marginBottom: 12 }} />
      <SkeletonCard />
      <SkeletonCard style={{ marginTop: 10 }} />
    </View>
  );
}

export function HubScreenSkeleton() {
  return (
    <View style={sk.container}>
      {/* Header */}
      <Skeleton width={60} height={28} style={{ marginBottom: 4 }} />
      <Skeleton width={140} height={13} style={{ marginBottom: 20 }} />

      {/* Next job card */}
      <View style={sk.card}>
        <View style={sk.cardRow}>
          <Skeleton width={40} height={40} borderRadius={RADIUS.lg} />
          <View style={sk.cardContent}>
            <Skeleton width="50%" height={14} />
            <Skeleton width="70%" height={12} style={{ marginTop: 6 }} />
          </View>
        </View>
      </View>

      {/* Period tabs */}
      <View style={[sk.periodRow, { marginTop: 16 }]}>
        <Skeleton width={80} height={32} borderRadius={RADIUS.full} />
        <Skeleton width={90} height={32} borderRadius={RADIUS.full} />
        <Skeleton width={70} height={32} borderRadius={RADIUS.full} />
      </View>

      {/* Stats grid */}
      <View style={sk.statsGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={sk.statCard}>
            <Skeleton width={32} height={32} borderRadius={RADIUS.lg} />
            <Skeleton width={50} height={20} style={{ marginTop: 8 }} />
            <Skeleton width={40} height={11} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Highlights */}
      <View style={sk.highlightsRow}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={sk.highlightCard}>
            <Skeleton width={16} height={16} borderRadius={RADIUS.full} />
            <Skeleton width={30} height={16} style={{ marginTop: 4 }} />
            <Skeleton width={50} height={10} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function ProfileScreenSkeleton() {
  return (
    <View style={sk.container}>
      {/* Title */}
      <Skeleton width={80} height={24} style={{ marginBottom: 24 }} />

      {/* Avatar */}
      <View style={sk.avatarSection}>
        <Skeleton width={96} height={96} borderRadius={RADIUS.full} />
        <Skeleton width={140} height={20} style={{ marginTop: 14 }} />
        <Skeleton width={200} height={13} style={{ marginTop: 6 }} />
      </View>

      {/* Account card */}
      <Skeleton width={70} height={12} style={{ marginBottom: 8, marginTop: 24 }} />
      <View style={sk.card}>
        <View style={sk.cardRow}>
          <Skeleton width={34} height={34} borderRadius={RADIUS.md} />
          <View style={sk.cardContent}>
            <Skeleton width="40%" height={13} />
            <Skeleton width="60%" height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: COLORS.gray100, marginHorizontal: 16 }} />
        <View style={[sk.cardRow, { paddingVertical: 14 }]}>
          <Skeleton width={34} height={34} borderRadius={RADIUS.md} />
          <View style={sk.cardContent}>
            <Skeleton width="35%" height={13} />
            <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: 12,
  },
  calendarDay: {
    alignItems: 'center',
    gap: 6,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContent: {
    flex: 1,
  },
  calendarBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: 16,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: 16,
  },
  highlightsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 12,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
  },
});
