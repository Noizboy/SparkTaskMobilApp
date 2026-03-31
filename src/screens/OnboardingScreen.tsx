import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, CalendarCheck, ClipboardList, Camera } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    Icon: Sparkles,
    title: 'Welcome to Spark Task',
    subtitle: 'Your professional cleaning management companion. Organized, efficient, and stress-free.',
    bg: COLORS.primary,
    iconBg: COLORS.white,
    iconColor: COLORS.primary,
  },
  {
    id: '2',
    Icon: CalendarCheck,
    title: 'Track Your Schedule',
    subtitle: 'See all your upcoming jobs at a glance. Never miss an appointment with smart calendar views.',
    bg: COLORS.foreground,
    iconBg: COLORS.primaryContainer,
    iconColor: COLORS.primary,
  },
  {
    id: '3',
    Icon: ClipboardList,
    title: 'Follow the Checklist',
    subtitle: 'Complete each task systematically. Section-by-section checklists keep you on track.',
    bg: '#1E3A5F',
    iconBg: COLORS.pastelBlue,
    iconColor: '#1E3A5F',
  },
  {
    id: '4',
    Icon: Camera,
    title: 'Document Your Work',
    subtitle: 'Capture before and after photos for every section. Build trust with your clients.',
    bg: COLORS.primaryDark,
    iconBg: COLORS.pastelGreen,
    iconColor: COLORS.primary,
  },
];

export function OnboardingScreen() {
  const { handleOnboardingComplete } = useApp();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      handleOnboardingComplete();
    }
  };

  const skip = () => handleOnboardingComplete();

  const slide = SLIDES[currentIndex];

  return (
    <LinearGradient
      colors={[slide.bg, `${slide.bg}DD`]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Skip */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity onPress={skip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const Icon = item.Icon;
          return (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                <Icon size={52} color={item.iconColor} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          );
        }}
      />

      {/* Bottom controls */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={goNext} style={styles.nextBtn} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: SPACING.xxl,
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 24,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: {
    paddingHorizontal: SPACING.xxl,
    gap: 20,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: RADIUS.full,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.white,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  nextBtn: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  nextBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.primary,
  },
});
