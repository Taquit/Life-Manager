import AsyncStorage from '@react-native-async-storage/async-storage';
import 'expo-router/entry';
import { AppRegistry } from 'react-native';
import { RNAndroidNotificationListenerHeadlessJsName } from 'react-native-android-notification-listener';
import { notiProcesor } from './src/services/notiProcesor';
import api from './src/services/api';
const headlessNotificationListener = async ({ notification }) => {
    if (notification) {
        try {
            // Parse the notification payload which is passed as a JSON string
            const notificationData = typeof notification === 'string' ? JSON.parse(notification) : notification;
            console.log('Received notification in background:', notificationData);

            // Lista de paquetes permitidos (whitelist)
            const ALLOWED_PACKAGES = [
                'com.google.android.apps.walletnfcrel',
                'com.nu.production',
                'com.bancomer.mbanking',
                'com.whatsapp', // <-- AÑADIDO PARA PRUEBAS
                // Agrega aquí los paquetes que sí quieres escuchar
            ];

            // Si la app de la notificación no está en el arreglo, la ignoramos
            if (!ALLOWED_PACKAGES.includes(notificationData.app)) {
                return;
            }

            // Guardamos la notificación en el almacenamiento local para poder leerla desde la pantalla de debug
            const existingStr = await AsyncStorage.getItem('@debug_notifications');
            let existing = [];
            if (existingStr) {
                existing = JSON.parse(existingStr);
            }

            // Añadimos la nueva y guardamos (maximo 50 para no llenar la memoria)
            existing.unshift(notificationData);
            if (existing.length > 50) existing.length = 50;

            await AsyncStorage.setItem('@debug_notifications', JSON.stringify(existing));

            // TODO: AQUI PUEDES ENVIAR LA NOTIFICACION AL BACKEND
            // if (notificationData.app === 'com.banco.app' || notificationData.app === 'com.google.android.apps.walletnfcrel') {
            //     await fetch('TU_URL_DEL_BACKEND', { method: 'POST', body: JSON.stringify(notificationData) });
            // }

            //Llamamos a la funcion notiProcesor
            const validNotification = await notiProcesor(notificationData);
            if (validNotification) {

                // enviamos al endpoint de transacciones
                const title = validNotification.title || `Gasto automático (${notificationData.app || 'App'})`;
                const amount = validNotification.amount;
                const card_id = validNotification.cardId;
                const category_id = null; // En la BD es tipo UUID. Pasar un '1' crashearía PostgreSQL.
                const date = new Date().toISOString();
                const isAuto = true;
                
                try {
                    const response = await api.post("/transactions", { title, amount, category_id, isAuto, card_id, date });
                    console.log("Respuesta del backend:", response.data);
                } catch (apiError) {
                    console.error("Error al hacer POST a /transactions:", apiError?.response?.data || apiError.message);
                }
            }

        } catch (error) {
            console.error('Error processing notification:', error);
        }
    }
};

// Se registra la tarea en segundo plano (Headless JS) para escuchar notificaciones
AppRegistry.registerHeadlessTask(RNAndroidNotificationListenerHeadlessJsName, () => headlessNotificationListener);
