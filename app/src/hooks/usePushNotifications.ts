import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiRegisterPushToken } from '../services/api';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Returns true when running inside the Expo Go client.
 * Remote push notifications require a development build or production build —
 * they were removed from Expo Go in SDK 53.
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * Requests push notification permissions, obtains the Expo push token,
 * and registers it with the API so the server can send targeted pushes.
 *
 * ⚠️  Remote push notifications are NOT supported in Expo Go (SDK 53+).
 *     Use `npx expo run:android` / `npx expo run:ios` (development build) for
 *     full push support. In Expo Go only local/foreground notifications work.
 *
 * Must be called after the user is authenticated and a valid JWT is available.
 */
export function usePushNotifications(token: string | null) {
  const registered = useRef(false);

  useEffect(() => {
    if (!token || token === 'true' || registered.current) return;

    async function registerForPush() {
      try {
        // Expo Go (SDK 53+) doesn't support remote push — skip silently
        if (isExpoGo()) {
          console.log('[Push] Skipping — Expo Go does not support remote push (SDK 53+). Use a development build.');
          return;
        }

        // Push notifications only work on physical devices
        if (!Device.isDevice) {
          console.log('[Push] Skipping — not a physical device');
          return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('[Push] Permission not granted');
          return;
        }

        // Android requires a notification channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'SparkTask',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#044728',
          });
        }

        // projectId is required in bare/standalone workflow
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        const expoPushToken = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        if (!expoPushToken.data) return;

        registered.current = true;
        await apiRegisterPushToken(token!, expoPushToken.data);
        console.log('[Push] Token registered:', expoPushToken.data);
      } catch (err) {
        console.warn('[Push] Registration failed:', err);
      }
    }

    registerForPush();
  }, [token]);
}
