import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar cómo debe comportarse la notificación cuando la app está abierta o en segundo plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

let channelInitialized = false;

export const initNotificationChannel = async () => {
  if (Platform.OS === 'android' && !channelInitialized) {
    try {
      await Notifications.setNotificationChannelAsync('auto_transactions', {
        name: 'Transacciones Automáticas (NFC)',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
      channelInitialized = true;
    } catch (error) {
      console.error('Error inicializando canal de notificaciones:', error);
    }
  }
};

interface AutoTransactionNotificationParams {
  title: string;
  amount: number;
  cardLast4?: string | null;
  bankName?: string | null;
}

/**
 * Dispara una notificación local inmediata para confirmar que el gasto automático NFC fue procesado y guardado.
 */
export const triggerAutoTransactionNotification = async ({
  title,
  amount,
  cardLast4,
  bankName,
}: AutoTransactionNotificationParams) => {
  try {
    await initNotificationChannel();

    const formattedAmount = `$${Number(amount).toFixed(2)}`;
    const cardInfo = cardLast4 ? ` (•••• ${cardLast4})` : '';
    const bodyText = `${title}: ${formattedAmount}${cardInfo} registrado exitosamente.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💳 Gasto Automático Registrado',
        body: bodyText,
        data: { title, amount, cardLast4, isAuto: true },
        sound: 'default',
        channelId: 'auto_transactions',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // Envío inmediato
    });

    console.log('[NOTIFICACION LOCAL] Notificación de confirmación lanzada con éxito:', bodyText);
  } catch (error) {
    console.error('Error disparando notificación local de transacción automática:', error);
  }
};
