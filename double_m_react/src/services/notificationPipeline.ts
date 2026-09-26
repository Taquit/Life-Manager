import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { notiProcesor, KNOWN_PACKAGES, NotificationData } from './notiProcesor';
import { triggerAutoTransactionNotification } from './localNotifications';

export const ALLOWED_PACKAGES = [
  'com.google.android.apps.walletnfcrel', // Google Wallet oficial
  'com.google.android.gms',              // Google Pay Services
  'com.nu.production',                  // Nu México
  'com.bancomer.mbanking',              // BBVA México
  'com.santander.app',                  // Santander México
  'com.mercadolibre',                   // Mercado Pago
  'com.mercadopago.wallet',             // Mercado Pago Wallet
  'com.whatsapp',                       // Para pruebas manuales rápidas
];

export interface DebugNotificationLog {
  id: string;
  timestamp: string;
  app: string;
  appFriendlyName: string;
  title: string;
  text: string;
  raw: NotificationData;
  filterStatus: 'ACCEPTED' | 'IGNORED_PACKAGE';
  processingStatus: 'SUCCESS' | 'NO_AMOUNT' | 'BACKEND_ERROR' | 'SKIPPED';
  extractedAmount?: number;
  extractedCardLast4?: string | null;
  transactionTitle?: string;
  steps: string[];
  backendResponse?: any;
  errorMessage?: string;
}

/**
 * Guarda un registro en el historial de debug en AsyncStorage (máximo 50 elementos)
 */
export const saveDebugLog = async (logEntry: DebugNotificationLog) => {
  try {
    const existingStr = await AsyncStorage.getItem('@debug_notifications');
    let logs: DebugNotificationLog[] = [];
    if (existingStr) {
      logs = JSON.parse(existingStr);
    }
    // Añadimos el nuevo al inicio
    logs.unshift(logEntry);
    if (logs.length > 50) logs.length = 50;
    await AsyncStorage.setItem('@debug_notifications', JSON.stringify(logs));
  } catch (error) {
    console.error('Error guardando log de debug:', error);
  }
};

/**
 * Pipeline central para procesar notificaciones tanto en segundo plano (Headless) como en el simulador
 */
export const processIncomingNotification = async (
  rawNotification: NotificationData,
  isSimulation = false
): Promise<DebugNotificationLog> => {
  const logId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();
  const app = rawNotification.app || 'unknown';
  const appFriendlyName = KNOWN_PACKAGES[app] || app;
  const isAccepted = ALLOWED_PACKAGES.includes(app) || isSimulation;

  const logEntry: DebugNotificationLog = {
    id: logId,
    timestamp,
    app,
    appFriendlyName,
    title: rawNotification.title || '',
    text: rawNotification.text || '',
    raw: rawNotification,
    filterStatus: isAccepted ? 'ACCEPTED' : 'IGNORED_PACKAGE',
    processingStatus: 'SKIPPED',
    steps: [],
  };

  if (!isAccepted) {
    logEntry.steps.push(`Paquete '${app}' no está en la lista de paquetes permitidos. Se omite el procesamiento.`);
    logEntry.processingStatus = 'SKIPPED';
    await saveDebugLog(logEntry);
    return logEntry;
  }

  logEntry.steps.push(`Paquete '${app}' aceptado (${appFriendlyName}). Iniciando extracción...`);

  try {
    // 1. Extraer datos con notiProcesor
    const result = await notiProcesor(rawNotification);
    logEntry.steps.push(...result.steps);
    logEntry.extractedAmount = result.amount;
    logEntry.extractedCardLast4 = result.cardLast4;
    logEntry.transactionTitle = result.title;

    if (!result.success || !result.amount) {
      logEntry.processingStatus = 'NO_AMOUNT';
      logEntry.errorMessage = result.errorMessage || 'No se pudo extraer un monto válido.';
      await saveDebugLog(logEntry);
      return logEntry;
    }

    // 2. Registrar la transacción en el backend
    logEntry.steps.push('Enviando transacción a la API (/transactions)...');
    const transactionPayload = {
      title: result.title,
      amount: result.amount,
      category_id: result.categoryId,
      isAuto: true,
      card_id: result.cardId,
      date: new Date().toISOString(),
    };

    const backendRes = await api.post('/transactions', transactionPayload);
    logEntry.backendResponse = backendRes.data;
    logEntry.processingStatus = 'SUCCESS';
    logEntry.steps.push(`¡Transacción creada en el backend con éxito! (ID: ${backendRes.data?.data?.id || 'OK'})`);

    // 3. Requisito 3: Disparar notificación local para asegurar al usuario que se registró
    logEntry.steps.push('Lanzando notificación local de confirmación en el dispositivo...');
    await triggerAutoTransactionNotification({
      title: result.title,
      amount: result.amount,
      cardLast4: result.cardLast4,
      bankName: appFriendlyName,
    });
    logEntry.steps.push('Notificación local mostrada con éxito.');

  } catch (error: any) {
    console.error('Error en pipeline de notificación:', error);
    logEntry.processingStatus = 'BACKEND_ERROR';
    logEntry.errorMessage = error.response?.data?.error || error.message || 'Error al comunicarse con el servidor';
    logEntry.steps.push(`Error en la transacción: ${logEntry.errorMessage}`);
  }

  await saveDebugLog(logEntry);
  return logEntry;
};
