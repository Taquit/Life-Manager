import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { GooglePayTransactionDTO } from '../types';
import { isDuplicateNotification } from './notiDeduplicator';
import { enqueueTransaction, flushOfflineQueue } from './offlineQueue';

export interface NotificationData {
  title?: string;
  text: string;
  app?: string;
  time?: number | string;
}

export interface ParsedNotification {
  amount: number | null;
  cardLast4: string | null;
  merchant: string;
  note: string;
  status: 'ready' | 'missing_amount' | 'missing_card';
  statusText: string;
}

export const GOOGLE_PAY_PACKAGES = [
  'com.google.android.apps.walletnfcrel',
  'com.google.android.apps.nfc.payment',
];

export const isGooglePayNotification = (data: NotificationData): boolean => {
  const app = (data.app || '').toLowerCase();
  if (GOOGLE_PAY_PACKAGES.includes(data.app || '')) return true;
  if (app.includes('wallet') || app.includes('google pay') || app.includes('gpay')) return true;
  return false;
};

export const parseNotification = (data: NotificationData): ParsedNotification => {
  const title = (data.title || '').trim();
  const text = (data.text || '').trim();
  const fullText = `${title} ${text}`;

  // 1. Extraccion del monto ($XX.XX, $ XX, $1,500.00)
  const amountMatch = fullText.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  const rawAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
  const amount = rawAmount && !isNaN(rawAmount) && rawAmount > 0 ? rawAmount : null;

  // 2. Extraccion de los ultimos 4 digitos
  const cardMatch =
    fullText.match(
      /(?:[•*xX]{2,4}\s*|termina(?:ción|cion| en)?\s+[*•]*\s*|(?:tarjeta|tc|tdc)\s+[*•xX]*\s*|cuenta\s+[*•xX]*\s*)(\d{4})/i
    ) || fullText.match(/\b(\d{4})\b/);
  const cardLast4 = cardMatch ? cardMatch[1] : null;

  // 3. Comercio / Merchant
  const merchant = title || 'Google Pay';

  // 4. Nota descriptiva
  const note = text || (cardLast4 ? `Cargo automatico Google Pay (${cardLast4})` : 'Cargo automatico Google Pay');

  // 5. Estado de validacion
  let status: 'ready' | 'missing_amount' | 'missing_card' = 'ready';
  let statusText = 'Listo para procesar';

  if (!amount) {
    status = 'missing_amount';
    statusText = 'Falta monto';
  } else if (!cardLast4) {
    status = 'missing_card';
    statusText = 'Falta tarjeta';
  }

  return {
    amount,
    cardLast4,
    merchant,
    note,
    status,
    statusText,
  };
};

export const triggerLocalNotification = async (
  amount: number,
  cardLast4: string,
  merchant?: string | null
): Promise<void> => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('moneyapp_transactions', {
        name: 'Transacciones Automaticas',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Transaccion automatica registrada',
        body: `Se registro automaticamente un gasto de $${amount} con tu tarjeta termina en ${cardLast4} (${merchant || 'Google Pay'})`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch (err) {
    console.error('Error disparando notificacion local:', err);
  }
};

export const notiProcesor = async (
  notificationData: NotificationData
): Promise<boolean> => {
  try {
    if (!isGooglePayNotification(notificationData)) {
      return false;
    }

    const parsed = parseNotification(notificationData);
    if (parsed.status !== 'ready' || !parsed.amount || !parsed.cardLast4) {
      return false;
    }

    // 1. Validar deduplicacion en ventana de 2 minutos
    const isDuplicate = await isDuplicateNotification(parsed.amount, parsed.cardLast4);
    if (isDuplicate) {
      console.log('Notificacion duplicada de Google Pay ignorada en cliente');
      return false;
    }

    // 2. Feedback inmediato al usuario mediante notificacion local
    await triggerLocalNotification(parsed.amount, parsed.cardLast4, parsed.merchant);

    // 3. Encolar en almacenamiento offline
    const txPayload: GooglePayTransactionDTO = {
      amount: parsed.amount,
      cardLast4: parsed.cardLast4,
      merchant: parsed.merchant,
      note: parsed.note,
      date: new Date().toISOString(),
    };
    await enqueueTransaction(txPayload);

    // 4. Intentar envio inmediato al backend
    await flushOfflineQueue();

    return true;
  } catch (error) {
    console.error('Error procesando notificacion de Google Pay:', error);
    return false;
  }
};