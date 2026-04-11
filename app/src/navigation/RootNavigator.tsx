import React, { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Calendar, Package2, User } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, FONTS, SHADOWS, SPACING } from '../constants/theme';
import { RootStackParamList, MainTabParamList } from '../types';

import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { HubScreen } from '../screens/HubScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { JobInfoScreen } from '../screens/JobInfoScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ChecklistScreen } from '../screens/ChecklistScreen';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';
import { DayJobsScreen } from '../screens/DayJobsScreen';
import { AllUpcomingJobsScreen } from '../screens/AllUpcomingJobsScreen';
import { AllCompletedJobsScreen } from '../screens/AllCompletedJobsScreen';
import { JobCompletedScreen } from '../screens/JobCompletedScreen';
import { PhotoGalleryScreen } from '../screens/PhotoGalleryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AnimatedScreen({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(10);

  useFocusEffect(
    React.useCallback(() => {
      translateY.value = withTiming(0, { duration: 200 });
      return () => {
        translateY.value = 10;
      };
    }, [])
  );

  const style = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

function withAnimation(Component: React.ComponentType) {
  return () => (
    <AnimatedScreen>
      <Component />
    </AnimatedScreen>
  );
}

interface CustomTabBarProps {
  state: any;
  navigation: any;
}

function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabs = [
    { key: 'Home', icon: Home, label: 'Home' },
    { key: 'Calendar', icon: Calendar, label: 'Calendar' },
    { key: 'Hub', icon: Package2, label: 'Hub' },
    { key: 'Profile', icon: User, label: 'Profile' },
  ];

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom - 4 : 12 }]}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const isActive = state.index === index;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => { if (!isActive) navigation.navigate(tab.key); }}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              activeOpacity={0.7}
            >
              <Icon
                size={22}
                color={COLORS.white}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/** Thin animated status banner displayed at the top of the screen */
const BANNER_CONTENT_HEIGHT = 40;
const BANNER_COLLAPSED_HEIGHT = 4;

function OfflineBanner() {
  const { isOnline, isSyncing } = useApp();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const height = useSharedValue(0);
  // Controls text visibility — fades out when the banner collapses to a strip
  const textOpacity = useSharedValue(1);

  // Track the previous isSyncing value to detect the true → false edge.
  const prevIsSyncing = useRef(false);
  // Briefly true for ~2 s right after a sync completes successfully.
  const [showSyncDone, setShowSyncDone] = useState(false);
  // True once the offline banner has collapsed down to the 4 px strip.
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Detect the isSyncing true → false transition while online.
  useEffect(() => {
    if (prevIsSyncing.current && !isSyncing && isOnline) {
      setShowSyncDone(true);
      const timer = setTimeout(() => setShowSyncDone(false), 2000);
      prevIsSyncing.current = isSyncing;
      return () => clearTimeout(timer);
    }
    prevIsSyncing.current = isSyncing;
  }, [isSyncing, isOnline]);

  // Banner is visible only while offline, actively syncing, or for the brief
  // post-sync success flash. The "N pending changes" state while online is
  // intentionally excluded — it was causing a persistent, noisy banner.
  const shouldShow = !isOnline || isSyncing || showSyncDone;

  // Derive total animated height including safe-area inset
  const totalHeight = insets.top + BANNER_CONTENT_HEIGHT;

  // 4-second collapse timer — only fires when the banner is purely offline
  // (not syncing, not in the post-sync success flash). Resets automatically
  // whenever connectivity returns or a sync/sync-done state takes over.
  useEffect(() => {
    if (!isOnline && !isSyncing && !showSyncDone) {
      const timer = setTimeout(() => {
        setIsCollapsed(true);
        textOpacity.value = withTiming(0, { duration: 300 });
      }, 4000);
      return () => clearTimeout(timer);
    }
    // Back online, syncing, or sync-done — restore full banner immediately
    setIsCollapsed(false);
    textOpacity.value = withTiming(1, { duration: 300 });
    // `textOpacity` is a stable SharedValue ref — intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, isSyncing, showSyncDone]);

  // Drive banner height:
  //   hidden        → 0
  //   collapsed strip → 4 px (offline only, after 4 s)
  //   full banner   → totalHeight
  useEffect(() => {
    if (!shouldShow) {
      height.value = withTiming(0, { duration: 300 });
    } else if (isCollapsed) {
      height.value = withTiming(BANNER_COLLAPSED_HEIGHT, { duration: 300 });
    } else {
      height.value = withTiming(totalHeight, { duration: 300 });
    }
    // `height` is a stable SharedValue ref — intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShow, totalHeight, isCollapsed]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  // Determine banner appearance — priority: offline > syncing > sync-done
  let bgColor: string;
  let textColor: string;
  let message: string;

  if (!isOnline) {
    bgColor = COLORS.warning;
    textColor = COLORS.foreground;
    message = t('syncOffline');
  } else if (isSyncing) {
    bgColor = COLORS.successDark;
    textColor = COLORS.white;
    message = t('syncSyncing');
  } else {
    // showSyncDone branch — 2-second success flash
    bgColor = COLORS.successDark;
    textColor = COLORS.white;
    message = t('syncDone');
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          backgroundColor: bgColor,
          justifyContent: 'flex-end',
          alignItems: 'center',
        },
        animatedStyle,
      ]}
    >
      <Animated.View style={textAnimatedStyle}>
        <View
          style={{
            height: BANNER_CONTENT_HEIGHT,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: SPACING.lg,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: textColor,
              fontFamily: FONTS.medium,
              fontSize: 12,
              letterSpacing: 0.1,
            }}
          >
            {message}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={withAnimation(HomeScreen)} />
      <Tab.Screen name="Calendar" component={withAnimation(CalendarScreen)} />
      <Tab.Screen name="Hub" component={withAnimation(HubScreen)} />
      <Tab.Screen name="Profile" component={withAnimation(ProfileScreen)} />
      <Tab.Screen name="Notifications" component={withAnimation(NotificationsScreen)} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, showOnboarding, isLoading } = useApp();

  if (isLoading) return null;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : showOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="JobInfo"
              component={JobInfoScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Checklist"
              component={ChecklistScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="OrderDetails"
              component={OrderDetailsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="DayJobs"
              component={DayJobsScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="AllUpcomingJobs"
              component={AllUpcomingJobsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="AllCompletedJobs"
              component={AllCompletedJobsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="JobCompleted"
              component={JobCompletedScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="PhotoGallery"
              component={PhotoGalleryScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </>
        )}
      </Stack.Navigator>
      {/* Offline / syncing banner rendered above all screens */}
      <OfflineBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  tabBar: {
    backgroundColor: COLORS.navBackground,
    borderRadius: 32,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    ...SHADOWS.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 24,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary,
  },
});
