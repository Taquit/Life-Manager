import 'expo-router/entry';
import { AppRegistry } from 'react-native';
import { RNAndroidNotificationListenerHeadlessJsName } from 'react-native-android-notification-listener';
import { processIncomingNotification } from './src/services/notificationPipeline';

/**
 * Tarea en segundo plano (Headless JS) para capturar notificaciones entrantes de Android
 */
const headlessNotificationListener = async ({ notification }) => {
  if (notification) {
    try {
      // Parsear la notificación si viene como string JSON
      const notificationData = typeof notification === 'string' ? JSON.parse(notification) : notification;
      console.log('[HeadlessJS] Notificación recibida en background:', notificationData);

      // Ejecutar el pipeline central de procesamiento
      await processIncomingNotification(notificationData);
    } catch (error) {
      console.error('[HeadlessJS] Error fatal procesando notificación en background:', error);
    }
  }
};

// Registrar la tarea en segundo plano con Android
AppRegistry.registerHeadlessTask(RNAndroidNotificationListenerHeadlessJsName, () => headlessNotificationListener);
