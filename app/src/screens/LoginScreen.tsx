import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  KeyboardEvent,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import type { CurrentUser } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { API_BASE } from '../services/api';
import { AUTH_CONFIG } from '../config/auth';
import { storage } from '../utils/storage';

export function LoginScreen() {
  const { handleLogin } = useApp();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const cardTranslateY = useSharedValue(0);

  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      cardTranslateY.value = withTiming(-e.endCoordinates.height, { duration: 250 });
    };
    const onHide = () => {
      cardTranslateY.value = withTiming(0, { duration: 250 });
    };

    const listeners = [
      Keyboard.addListener('keyboardDidShow', onShow),
      Keyboard.addListener('keyboardDidHide', onHide),
    ];

    if (Platform.OS === 'ios') {
      listeners.push(
        Keyboard.addListener('keyboardWillShow', onShow),
        Keyboard.addListener('keyboardWillHide', onHide),
      );
    }

    return () => listeners.forEach((l) => l.remove());
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const onSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      // Offline-first: check against known demo accounts (no real backend required).
      const normalizedEmail = email.trim().toLowerCase();
      const demoMatch = AUTH_CONFIG.DEMO_USERS.find(
        (u) => u.email === normalizedEmail && u.password === password
      );
      if (demoMatch) {
        // Always attempt the real API first — it returns the full user record
        // including any avatar_url the cleaner has saved to their profile.
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail, password }),
          });
          if (res.ok) {
            const apiUser = await res.json();
            await handleLogin(
              {
                id: String(apiUser.id),
                name: apiUser.name,
                email: apiUser.email,
                role: apiUser.role,
                company: apiUser.company,
                phone: apiUser.phone ?? undefined,
                avatar_url: apiUser.avatar_url ?? undefined,
              },
              apiUser.token,
            );
            return;
          }
          // Non-2xx (e.g. 401 wrong password for a real account that happens to
          // share an email) — treat as API unavailable and use the offline path.
        } catch {
          // Network error — no connectivity. Fall through to offline demo path.
        }

        // API unavailable: use the hardcoded demo user but preserve any
        // avatar_url the user previously saved, identified by matching email
        // so we never carry over a different account's photo.
        const { password: _pw, ...demoUser } = demoMatch;
        const storedUser = await storage.getJSON<CurrentUser>('currentUser');
        const avatar_url =
          storedUser?.email === normalizedEmail ? storedUser.avatar_url : undefined;
        await handleLogin({ ...demoUser, avatar_url });
        return;
      }

      // Fall back to real API for non-demo accounts.
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      if (!res.ok) {
        setError(t('invalidCredentials'));
        return;
      }
      const user = await res.json();
      await handleLogin({ id: String(user.id), name: user.name, email: user.email, role: user.role, company: user.company, phone: user.phone ?? undefined, avatar_url: user.avatar_url ?? undefined }, user.token);
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={[styles.gradient, { paddingTop: insets.top + 20 }]}
      >
        {/* Logo — fills all space above the form card */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrap}>
            <Sparkles size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>Spark Task</Text>
          <Text style={styles.tagline}>{t('loginTagline')}</Text>
        </View>

        {/* Form card — anchored to bottom; slides above keyboard on both platforms */}
        <Animated.View style={[styles.formCard, { paddingBottom: insets.bottom + 24 }, cardAnimStyle]}>
          <Text style={styles.welcomeTitle}>{t('welcomeBack')}</Text>
          <Text style={styles.welcomeSub}>{t('signInSubtitle')}</Text>

          <View style={styles.fields}>
            <TextInput
              label={t('emailAddress')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              mode="outlined"
              outlineColor={COLORS.gray200}
              activeOutlineColor={COLORS.primary}
              style={styles.input}
              contentStyle={styles.inputContent}
              theme={{ roundness: RADIUS.xl }}
            />

            <TextInput
              label={t('password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              mode="outlined"
              outlineColor={COLORS.gray200}
              activeOutlineColor={COLORS.primary}
              style={styles.input}
              contentStyle={styles.inputContent}
              theme={{ roundness: RADIUS.xl }}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                  color={COLORS.mutedForeground}
                />
              }
            />
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity>
              <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={onSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.loginBtnText}>{t('signIn')}</Text>
            )}
          </TouchableOpacity>

        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingBottom: 32,
  },
  logoWrap: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.lg,
  },
  appName: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.white,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 32,
  },
  welcomeTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.foreground,
    marginBottom: 4,
  },
  welcomeSub: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.mutedForeground,
    marginBottom: 28,
  },
  fields: {
    gap: 14,
  },
  input: {
    backgroundColor: COLORS.white,
    fontSize: 15,
  },
  inputContent: {
    fontFamily: FONTS.regular,
    height: 52,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    marginBottom: 4,
  },
  forgotText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.primary,
  },
  errorBox: {
    marginTop: 12,
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...SHADOWS.md,
  },
  loginBtnDisabled: {
    opacity: 0.65,
  },
  loginBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.white,
  },
});
