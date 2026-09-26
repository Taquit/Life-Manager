import { Platform, Linking, Alert } from 'react-native';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import * as Notifications from 'expo-notifications';

export type NotificationPermissionStatus = 'authorized' | 'denied' | 'unknown' | 'not_supported';

/**
 * Obtiene el estado del permiso para escuchar notificaciones de otras apps (Android NotificationListenerService)
 */
export const getNotificationListenerStatus = async (): Promise<NotificationPermissionStatus> => {
  if (Platform.OS !== 'android') {
    return 'not_supported';
  }
  try {
    const status = await RNAndroidNotificationListener.getPermissionStatus();
    // En algunas versiones regresa boolean o string
    if (status === 'authorized' || status === true) {
      return 'authorized';
    }
    if (status === 'denied' || status === false) {
      return 'denied';
    }
    return (status as NotificationPermissionStatus) || 'unknown';
  } catch (error) {
    console.error('Error al obtener estado de NotificationListener:', error);
    return 'unknown';
  }
};

/**
 * Abre la pantalla exacta de Ajustes del Sistema Android para activar el acceso a notificaciones
 */
export const openNotificationListenerSettings = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    Alert.alert(
      'No compatible',
      'La lectura de notificaciones para pagos automáticos solo está disponible en dispositivos Android.'
    );
    return;
  }

  try {
    // 1. Intentar con el método nativo de la librería
    RNAndroidNotificationListener.requestPermission();
  } catch (err) {
    console.warn('Fallo requestPermission(), intentando sendIntent directo:', err);
    try {
      // 2. Intent directo de Android a la pantalla de Acceso a Notificaciones
      await Linking.sendIntent('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS');
    } catch (fallbackErr) {
      console.warn('Fallo sendIntent, abriendo ajustes generales:', fallbackErr);
      try {
        // 3. Fallback a los ajustes generales de la app
        await Linking.openSettings();
      } catch (finalErr) {
        Alert.alert(
          'Error al abrir ajustes',
          'Por favor ve manualmente a Configuración > Aplicaciones > Acceso especial > Acceso a notificaciones y activa esta aplicación.'
        );
      }
    }
  }
};

/**
 * Solicita y verifica el permiso de notificaciones locales (requerido en Android 13+)
 */
export const requestLocalNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error al solicitar permisos de notificaciones locales:', error);
    return false;
  }
};
