import AsyncStorage from '@react-native-async-storage/async-storage';
import 'expo-router/entry';
import { AppRegistry, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { RNAndroidNotificationListenerHeadlessJsName } from 'react-native-android-notification-listener';
import { notiProcesor } from './src/services/notiProcesor';

// Configuracion para mostrar alertas locales en primer plano cuando la app esta abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const headlessNotificationListener = async ({ notification }) => {
  if (notification) {
    try {
      // Parse the notification payload which is passed as a JSON string
      const notificationData =
        typeof notification === 'string' ? JSON.parse(notification) : notification;
      console.log('Received notification in background:', notificationData);

      if (!notificationData.time) {
        notificationData.time = Date.now();
      }

      // Lista de paquetes permitidos (exclusivo para Google Pay / Wallet)
      const ALLOWED_PACKAGES = [
        'com.google.android.apps.walletnfcrel',
        'com.google.android.apps.nfc.payment',
      ];

      const appName = (notificationData.app || '').toLowerCase();
      const isGooglePay =
        ALLOWED_PACKAGES.includes(notificationData.app) ||
        appName.includes('wallet') ||
        appName.includes('google pay') ||
        appName.includes('gpay');

      // Si la app de la notificacion no es de Google Pay, la ignoramos
      if (!isGooglePay) {
        return;
      }

      // Guardamos la notificacion en el almacenamiento local para poder leerla desde la pantalla de debug
      const existingStr = await AsyncStorage.getItem('@debug_notifications');
      let existing = [];
      if (existingStr) {
        existing = JSON.parse(existingStr);
      }

      // Anadimos la nueva y guardamos (maximo 50 para no llenar la memoria)
      existing.unshift(notificationData);
      if (existing.length > 50) existing.length = 50;

      await AsyncStorage.setItem('@debug_notifications', JSON.stringify(existing));

      // Procesar y registrar transaccion automatica en el backend (dispara notificacion local si es exitosa)
      const success = await notiProcesor(notificationData);
      if (success) {
        console.log('Transaccion automatica Google Pay procesada con exito');
      }
    } catch (error) {
      console.error('Error processing notification:', error);
    }
  }
};

// Se registra la tarea en segundo plano (Headless JS) para escuchar notificaciones solo en Android
if (Platform.OS === 'android' && typeof AppRegistry.registerHeadlessTask === 'function') {
  AppRegistry.registerHeadlessTask(
    RNAndroidNotificationListenerHeadlessJsName,
    () => headlessNotificationListener
  );
}
