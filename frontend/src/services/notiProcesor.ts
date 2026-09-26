import { transactionsApi } from './api';
import { Transaction } from '../types';

export interface NotificationData {
  title?: string;
  text: string;
  app?: string;
}

const GOOGLE_PAY_PACKAGES = [
  'com.google.android.apps.walletnfcrel',
  'com.google.android.apps.nfc.payment',
];

export const isGooglePayNotification = (data: NotificationData): boolean => {
  const app = (data.app || '').toLowerCase();
  if (GOOGLE_PAY_PACKAGES.includes(data.app || '')) return true;
  if (app.includes('wallet') || app.includes('google pay') || app.includes('gpay')) return true;
  return false;
};

export const notiProcesor = async (
  notificationData: NotificationData
): Promise<Transaction | null> => {
  try {
    const { title, text, app } = notificationData;

    // 1. Escuchar exclusivamente notificaciones de Google Pay
    if (!isGooglePayNotification(notificationData)) {
      return null;
    }

    const fullText = `${title || ''} ${text || ''}`;

    // 2. Extraccion del monto (Soporta "$150", "$ 150", "$1,500.00", "$ 1,500,000.00")
    const amountMatch = fullText.match(/\$\s*([\d,]+(?:\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
    if (!amount || isNaN(amount) || amount <= 0) {
      return null;
    }

    // 3. Extraccion de los ultimos 4 digitos de la tarjeta
    // Soporta: "••• 1234", "**1234", "termina en 1234", "terminacion 1234", "tarjeta 1234", "tc 1234"
    const cardMatch =
      fullText.match(
        /(?:[•*xX]{2,4}\s*|termina(?:ción|cion| en)?\s+[*•]*\s*|(?:tarjeta|tc|tdc)\s+[*•xX]*\s*|cuenta\s+[*•xX]*\s*)(\d{4})/i
      ) || fullText.match(/\b(\d{4})\b/);

    const cardLast4 = cardMatch ? cardMatch[1] : null;
    if (!cardLast4) {
      return null;
    }

    // 4. Registrar transaccion automatica via endpoint especializado
    const createdTx = await transactionsApi.createGooglePay({
      amount,
      cardLast4,
      merchant: title || 'Google Pay',
      note: text || `Cargo automatico Google Pay (${cardLast4})`,
      date: new Date().toISOString(),
    });

    return createdTx;
  } catch (error) {
    console.error('Error procesando notificacion de Google Pay:', error);
    return null;
  }
};