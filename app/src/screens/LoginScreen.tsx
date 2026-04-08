import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { API_BASE } from '../services/api';

export function LoginScreen() {
  const { handleLogin } = useApp();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError(t('invalidCredentials'));
        return;
      }
      const user = await res.json();
      await handleLogin({ id: String(user.id), name: user.name, email: user.email, role: user.role, company: user.company, phone: user.phone ?? undefined, avatar_url: user.avatar_url ?? undefined });
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={[styles.gradient, { paddingTop: insets.top + 20 }]}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrap}>
            <Sparkles size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>Spark Task</Text>
          <Text style={styles.tagline}>{t('loginTagline')}</Text>
        </View>

        {/* Form card */}
        <ScrollView
          style={styles.formCard}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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

          {/* Demo hint */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>{t('demoCredentials')}</Text>
            <Text style={styles.demoText}>
              Email: <Text style={styles.demoValue}>alejandro@sparktask.com</Text>
            </Text>
            <Text style={styles.demoText}>
              Password: <Text style={styles.demoValue}>demo</Text>
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
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
    flex: 1,
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
  demoBox: {
    marginTop: 24,
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 3,
  },
  demoTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 4,
  },
  demoText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.gray400,
  },
  demoValue: {
    fontFamily: FONTS.medium,
    color: COLORS.gray700,
  },
});
