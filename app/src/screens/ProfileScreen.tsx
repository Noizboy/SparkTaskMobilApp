import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { User, Mail, Phone, Lock, Camera, LogOut, Info, ChevronRight, Globe, HelpCircle, FileText, Shield, ExternalLink } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { API_BASE } from '../services/api';
import { storage } from '../utils/storage';
import { AUTH_CONFIG } from '../config/auth';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { handleLogout, currentUser, updateCurrentUser } = useApp();
  const { language: currentLangCode, setLanguage: setLangFromContext, t } = useLanguage();

  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION ?? '1.0.0';

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'zh', label: 'Chinese Simplified' },
  ];

  const currentLang = LANGUAGES.find((l) => l.code === currentLangCode) ?? LANGUAGES[0];

  const pickImage = async () => {
    if (!currentUser) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permissionNeeded'), t('allowPhotos'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const localUri = result.assets[0].uri;
    // Optimistic update — show local URI immediately while uploading
    await updateCurrentUser({ avatar_url: localUri });
    try {
      const formData = new FormData();
      formData.append('avatar', { uri: localUri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
      const token = await storage.get(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      const headers: Record<string, string> = {};
      if (token && token !== 'true') headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/users/me/avatar`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (res.ok) {
        const updated = await res.json();
        // Replace local URI with canonical server URL — auto-persisted to AsyncStorage
        await updateCurrentUser({ avatar_url: updated.avatar_url });
      }
    } catch (err) {
      console.error('[API] uploadAvatar failed:', err);
      // Keep optimistic local URI — user still sees their selection
    }
  };

  const handleSavePhone = async () => {
    if (!currentUser) {
      Alert.alert(t('error'), 'Session expired. Please log out and log back in.');
      return;
    }
    try {
      const token = await storage.get(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'true') headers['Authorization'] = `Bearer ${token}`;
      const url = `${API_BASE}/users/me`;
      console.log('[API] PATCH phone →', url, { phone });
      const res = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ phone }),
      });
      console.log('[API] PATCH phone ←', res.status);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body}`);
      }
      const serverUser = await res.json();
      const updated = { ...currentUser, phone, id: String(serverUser.id) };
      await updateCurrentUser(updated);
    } catch (err: any) {
      console.error('[API] updatePhone failed:', err);
      Alert.alert(t('error'), `Could not save phone number.\n\n${err.message}`);
      return;
    }
    setIsEditingPhone(false);
  };

  const handleChangePwd = async () => {
    if (newPwd !== confirmPwd) {
      Alert.alert(t('error'), t('passwordsNoMatch'));
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert(t('error'), t('passwordTooShort'));
      return;
    }
    if (!currentUser?.id) {
      Alert.alert(t('error'), 'Session expired. Please log out and log back in.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword: currentPwd,
          newPassword: newPwd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert(t('error'), data.error || 'Failed to change password.');
        return;
      }
      setIsChangingPwd(false);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      Alert.alert(t('success'), t('passwordUpdated'));
    } catch (err) {
      Alert.alert(t('error'), 'Could not connect to server. Check your connection.');
    }
  };

  const confirmLogout = () => {
    Alert.alert(t('signOut'), t('signOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: handleLogout },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile')}</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.avatarWrap}>
            {currentUser?.avatar_url ? (
              <Image source={{ uri: currentUser.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <User size={44} color={COLORS.white} />
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Camera size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{currentUser?.name ?? ''}</Text>
          <Text style={styles.userEmail}>
            {currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role === 'supervisor' ? 'Supervisor' : 'Cleaner'}
          </Text>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('account')}</Text>
          <View style={styles.card}>
            <InfoRow icon={<Mail size={17} color={COLORS.white} />} label={t('email')} value={currentUser?.email ?? ''} />
            <View style={styles.divider} />
            {isEditingPhone ? (
              <View style={styles.editRow}>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  mode="outlined"
                  dense
                  outlineColor={COLORS.gray200}
                  activeOutlineColor={COLORS.primary}
                  style={{ flex: 1, fontSize: 14, backgroundColor: COLORS.white }}
                  theme={{ roundness: RADIUS.md }}
                />
                <TouchableOpacity onPress={handleSavePhone} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingPhone(true)} activeOpacity={0.7}>
                <InfoRow
                  icon={<Phone size={17} color={COLORS.white} />}
                  label={t('phone')}
                  value={phone}
                  action={<ChevronRight size={16} color={COLORS.gray400} />}
                />
              </TouchableOpacity>
            )}
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => setShowLangDropdown(!showLangDropdown)} activeOpacity={0.7}>
              <InfoRow
                icon={<Globe size={17} color={COLORS.white} />}
                label={t('language')}
                value={currentLang.label}
                action={<ChevronRight size={16} color={COLORS.gray400} style={{ transform: [{ rotate: showLangDropdown ? '90deg' : '0deg' }] }} />}
              />
            </TouchableOpacity>
            {showLangDropdown && (
              <View style={langStyles.dropdown}>
                {LANGUAGES.map((lang) => {
                  const selected = currentLangCode === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={langStyles.option}
                      onPress={() => { setLangFromContext(lang.code as any); setShowLangDropdown(false); }}
                      activeOpacity={0.7}
                    >
                      <View style={[langStyles.radio, selected && langStyles.radioSelected]}>
                        {selected && <View style={langStyles.radioDot} />}
                      </View>
                      <Text style={[langStyles.label, selected && langStyles.labelActive]}>{lang.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('security')}</Text>
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setIsChangingPwd(!isChangingPwd)} activeOpacity={0.7}>
              <InfoRow
                icon={<Lock size={17} color={COLORS.white} />}
                label={t('changePassword')}
                value=""
                action={<ChevronRight size={16} color={COLORS.gray400} />}
              />
            </TouchableOpacity>
            {isChangingPwd && (
              <View style={styles.pwdForm}>
                <TextInput
                  label={t('currentPassword')}
                  value={currentPwd}
                  onChangeText={setCurrentPwd}
                  secureTextEntry
                  mode="outlined"
                  dense
                  outlineColor={COLORS.gray200}
                  activeOutlineColor={COLORS.primary}
                  style={styles.pwdInput}
                  theme={{ roundness: RADIUS.md }}
                />
                <TextInput
                  label={t('newPassword')}
                  value={newPwd}
                  onChangeText={setNewPwd}
                  secureTextEntry
                  mode="outlined"
                  dense
                  outlineColor={COLORS.gray200}
                  activeOutlineColor={COLORS.primary}
                  style={styles.pwdInput}
                  theme={{ roundness: RADIUS.md }}
                />
                <TextInput
                  label={t('confirmPassword')}
                  value={confirmPwd}
                  onChangeText={setConfirmPwd}
                  secureTextEntry
                  mode="outlined"
                  dense
                  outlineColor={COLORS.gray200}
                  activeOutlineColor={COLORS.primary}
                  style={styles.pwdInput}
                  theme={{ roundness: RADIUS.md }}
                />
                <TouchableOpacity onPress={handleChangePwd} style={styles.updatePwdBtn}>
                  <Text style={styles.updatePwdText}>{t('updatePassword')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('about')}</Text>
          <View style={styles.card}>
            <InfoRow
              icon={<Info size={17} color={COLORS.white} />}
              label={t('appVersion')}
              value={APP_VERSION}
            />
          </View>
        </View>

        {/* Help */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('help')}</Text>
          <View style={styles.card}>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:support@sparktask.app')} activeOpacity={0.7}>
              <InfoRow
                icon={<Mail size={17} color={COLORS.white} />}
                label={t('contactUs')}
                value="support@sparktask.app"
                action={<ExternalLink size={14} color={COLORS.gray400} />}
              />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => Linking.openURL('https://sparktask.app/how-to')} activeOpacity={0.7}>
              <InfoRow
                icon={<Info size={17} color={COLORS.white} />}
                label={t('howTo')}
                value={t('howToSub')}
                action={<ExternalLink size={14} color={COLORS.gray400} />}
              />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => Linking.openURL('https://sparktask.app/faq')} activeOpacity={0.7}>
              <InfoRow
                icon={<HelpCircle size={17} color={COLORS.white} />}
                label={t('faq')}
                value={t('faqSub')}
                action={<ExternalLink size={14} color={COLORS.gray400} />}
              />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => Linking.openURL('https://sparktask.app/help')} activeOpacity={0.7}>
              <InfoRow
                icon={<HelpCircle size={17} color={COLORS.white} />}
                label={t('helpCenter')}
                value={t('helpCenterSub')}
                action={<ExternalLink size={14} color={COLORS.gray400} />}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('legal')}</Text>
          <View style={styles.card}>
            <TouchableOpacity onPress={() => Linking.openURL('https://sparktask.app/terms')} activeOpacity={0.7}>
              <InfoRow
                icon={<FileText size={17} color={COLORS.white} />}
                label={t('termsOfService')}
                value=""
                action={<ExternalLink size={14} color={COLORS.gray400} />}
              />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => Linking.openURL('https://sparktask.app/privacy')} activeOpacity={0.7}>
              <InfoRow
                icon={<Shield size={17} color={COLORS.white} />}
                label={t('privacyPolicy')}
                value=""
                action={<ExternalLink size={14} color={COLORS.gray400} />}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={[styles.section, { marginTop: 8 }]}>
          <TouchableOpacity onPress={confirmLogout} style={styles.logoutBtn} activeOpacity={0.85}>
            <LogOut size={18} color={COLORS.error} />
            <Text style={styles.logoutText}>{t('signOut')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.iconWrap}>{icon}</View>
      <View style={infoStyles.content}>
        <Text style={infoStyles.label}>{label}</Text>
        {value ? <Text style={infoStyles.value}>{value}</Text> : null}
      </View>
      {action && <View style={infoStyles.action}>{action}</View>}
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 1,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.foreground,
  },
  value: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.mutedForeground,
  },
  action: {
    marginLeft: 8,
  },
});

const langStyles = StyleSheet.create({
  dropdown: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  label: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.foreground,
  },
  labelActive: {
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.foreground,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: 6,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.full,
  },
  avatarFallback: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.foreground,
  },
  userEmail: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.mutedForeground,
  },
  section: {
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: COLORS.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginHorizontal: SPACING.lg,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: 8,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
  },
  saveBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    color: COLORS.white,
  },
  pwdForm: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: 10,
  },
  pwdInput: {
    backgroundColor: COLORS.white,
    fontSize: 13,
  },
  updatePwdBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  updatePwdText: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.white,
  },
  logoutBtn: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.error,
  },
});
