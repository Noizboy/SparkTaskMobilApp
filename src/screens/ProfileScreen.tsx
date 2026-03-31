import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { User, Mail, Phone, Lock, Camera, LogOut, Info, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { useApp } from '../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { handleLogout, profileImage, setProfileImage } = useApp();

  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const USER = { name: 'Sarah Johnson', email: 'sarah.johnson@cleaningco.com', version: '1.0.0' };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const handleSavePhone = () => setIsEditingPhone(false);

  const handleChangePwd = () => {
    if (newPwd === confirmPwd && newPwd.length >= 6) {
      setIsChangingPwd(false);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      Alert.alert('Success', 'Password updated successfully.');
    } else if (newPwd !== confirmPwd) {
      Alert.alert('Error', 'Passwords do not match.');
    } else {
      Alert.alert('Error', 'Password must be at least 6 characters.');
    }
  };

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.avatarWrap}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <User size={44} color={COLORS.white} />
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Camera size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{USER.name}</Text>
          <Text style={styles.userEmail}>{USER.email}</Text>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            <InfoRow icon={<Mail size={17} color={COLORS.primary} />} label="Email" value={USER.email} />
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
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingPhone(true)} activeOpacity={0.7}>
                <InfoRow
                  icon={<Phone size={17} color={COLORS.primary} />}
                  label="Phone"
                  value={phone}
                  action={<ChevronRight size={16} color={COLORS.gray400} />}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Security</Text>
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setIsChangingPwd(!isChangingPwd)} activeOpacity={0.7}>
              <InfoRow
                icon={<Lock size={17} color={COLORS.primary} />}
                label="Change Password"
                value=""
                action={<ChevronRight size={16} color={COLORS.gray400} />}
              />
            </TouchableOpacity>
            {isChangingPwd && (
              <View style={styles.pwdForm}>
                <TextInput
                  label="Current Password"
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
                  label="New Password"
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
                  label="Confirm Password"
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
                  <Text style={styles.updatePwdText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.card}>
            <InfoRow
              icon={<Info size={17} color={COLORS.primary} />}
              label="App Version"
              value={USER.version}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={[styles.section, { marginTop: 8 }]}>
          <TouchableOpacity onPress={confirmLogout} style={styles.logoutBtn} activeOpacity={0.85}>
            <LogOut size={18} color={COLORS.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
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
    backgroundColor: COLORS.primaryContainer,
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
    fontSize: 13,
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
