import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppNotification } from '../types';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: '1',
    type: 'upcoming',
    title: 'Job Starting Soon',
    message: 'Job #2847 will start in 2 hours at 456 Maple Drive',
    time: '10 min ago',
    isRead: false,
  },
  {
    id: '2',
    type: 'new_job',
    title: 'New Job Assigned',
    message: 'Job #2851 has been added to your schedule for today at 2:00 PM',
    time: '1 hour ago',
    isRead: false,
  },
  {
    id: '3',
    type: 'reminder',
    title: 'Upload Photos',
    message: 'Job #2839 is in progress. Don\'t forget to upload before/after photos.',
    time: '3 hours ago',
    isRead: true,
  },
  {
    id: '4',
    type: 'upcoming',
    title: 'Job Starting Soon',
    message: 'Job #2855 starts in 30 minutes at 12 Sunset Blvd',
    time: '5 hours ago',
    isRead: true,
  },
  {
    id: '5',
    type: 'completed',
    title: 'Job Completed',
    message: 'Great job! Order #2831 has been marked as completed.',
    time: '1 day ago',
    isRead: true,
  },
  {
    id: '6',
    type: 'new_job',
    title: 'New Job Assigned',
    message: 'Job #2855 (move-out clean) added for April 5 at 10:00 AM',
    time: '1 day ago',
    isRead: true,
  },
];

function NotifIcon({ type }: { type: AppNotification['type'] }) {
  const color = COLORS.primary;
  const size = 18;
  if (type === 'upcoming') return <Clock size={size} color={color} />;
  if (type === 'new_job') return <Calendar size={size} color={color} />;
  if (type === 'reminder') return <AlertCircle size={size} color={color} />;
  if (type === 'completed') return <CheckCircle2 size={size} color={color} />;
  return <Bell size={size} color={color} />;
}

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <Text style={styles.unreadHint}>
          {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
        </Text>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Bell size={36} color={COLORS.gray400} />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              onPress={() => markAsRead(notif.id)}
              style={[styles.card, notif.isRead ? styles.cardRead : styles.cardUnread]}
              activeOpacity={0.85}
            >
              {!notif.isRead && <View style={styles.unreadDot} />}

              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: notif.isRead ? COLORS.gray100 : COLORS.primaryContainer },
                ]}
              >
                <NotifIcon type={notif.type} />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{notif.title}</Text>
                <Text style={styles.cardMessage}>{notif.message}</Text>
                <Text style={styles.cardTime}>{notif.time}</Text>
              </View>
            </TouchableOpacity>
          ))
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.foreground,
  },
  markAll: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.primary,
  },
  unreadHint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.mutedForeground,
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingHorizontal: SPACING.xxl,
    gap: 10,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1.5,
    ...SHADOWS.sm,
    position: 'relative',
  },
  cardRead: {
    borderColor: COLORS.gray200,
  },
  cardUnread: {
    borderColor: COLORS.primary,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 9,
    height: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 3,
    paddingRight: 16,
  },
  cardTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.foreground,
  },
  cardMessage: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.mutedForeground,
    lineHeight: 19,
  },
  cardTime: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.foreground,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.mutedForeground,
  },
});
