import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Clock, Calendar, CheckCircle2, AlertCircle, UserPlus, UserMinus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppNotification } from '../types';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

function NotifIcon({ type, isRead }: { type: AppNotification['type']; isRead: boolean }) {
  const color = isRead ? COLORS.primary : COLORS.white;
  const size = 18;
  if (type === 'upcoming') return <Clock size={size} color={color} />;
  if (type === 'new_job') return <Calendar size={size} color={color} />;
  if (type === 'reminder') return <AlertCircle size={size} color={color} />;
  if (type === 'completed') return <CheckCircle2 size={size} color={color} />;
  if (type === 'assigned') return <UserPlus size={size} color={color} />;
  if (type === 'removed') return <UserMinus size={size} color={color} />;
  return <Bell size={size} color={color} />;
}

function formatTime(time: string): string {
  const date = new Date(time);
  if (isNaN(date.getTime())) return time;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} hour${diffH === 1 ? '' : 's'} ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return '1 day ago';
  return `${diffD} days ago`;
}

function useNotifText(notif: AppNotification, t: ReturnType<typeof useLanguage>['t']) {
  const m = notif.metadata;

  if (notif.type === 'assigned' && m?.orderNumber) {
    const title = t('notifAssignedTitle');
    const message = m.date && m.time
      ? t('notifAssignedMessageWithDate', { orderNumber: m.orderNumber, date: m.date, time: m.time })
      : t('notifAssignedMessage', { orderNumber: m.orderNumber });
    return { title, message };
  }

  if (notif.type === 'removed' && m?.orderNumber) {
    return {
      title: t('notifUnassignedTitle'),
      message: t('notifUnassignedMessage', { orderNumber: m.orderNumber }),
    };
  }

  return { title: notif.title, message: notif.message };
}

function NotifCard({ notif, onPress }: { notif: AppNotification; onPress: () => void }) {
  const { t } = useLanguage();
  const { title, message } = useNotifText(notif, t);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, notif.isRead ? styles.cardRead : styles.cardUnread]}
      activeOpacity={0.85}
    >
      {!notif.isRead && <View style={styles.unreadDot} />}

      <View
        style={[
          styles.iconWrap,
          { backgroundColor: notif.isRead ? COLORS.gray100 : COLORS.primary },
        ]}
      >
        <NotifIcon type={notif.type} isRead={notif.isRead} />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardMessage}>{message}</Text>
        <Text style={styles.cardTime}>{formatTime(notif.time)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, markAsRead, markAllRead } = useApp();
  const { t } = useLanguage();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('notifications')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>{t('markAllAsRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <Text style={styles.unreadHint}>
          {unreadCount} {unreadCount > 1 ? t('unreadNotifications') : t('unreadNotification')}
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
            <Text style={styles.emptyTitle}>{t('noNotifications')}</Text>
            <Text style={styles.emptyText}>{t('allCaughtUp')}</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <NotifCard key={notif.id} notif={notif} onPress={() => markAsRead(notif.id)} />
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
