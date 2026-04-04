import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Calendar, CalendarClock, User } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

import { useApp } from '../context/AppContext';
import { COLORS, FONTS, SHADOWS } from '../constants/theme';
import { RootStackParamList, MainTabParamList } from '../types';

import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { HubScreen } from '../screens/HubScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { JobInfoScreen } from '../screens/JobInfoScreen';
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
    { key: 'Hub', icon: CalendarClock, label: 'Hub' },
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
              onPress={() => navigation.navigate(tab.key)}
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
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, showOnboarding, isLoading } = useApp();

  if (isLoading) return null;

  return (
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
