import AsyncStorage from '@react-native-async-storage/async-storage';
import { transactionsApi } from './api';
import { GooglePayTransactionDTO } from '../types';

const QUEUE_STORAGE_KEY = '@moneyapp_offline_gpay_queue';

export const enqueueTransaction = async (
  transaction: GooglePayTransactionDTO
): Promise<void> => {
  try {
    const currentQueueStr = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    const queue: GooglePayTransactionDTO[] = currentQueueStr
      ? JSON.parse(currentQueueStr)
      : [];

    queue.push({
      ...transaction,
      date: transaction.date || new Date().toISOString(),
    });

    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error encolando transaccion offline:', error);
  }
};

export const getOfflineQueueCount = async (): Promise<number> => {
  try {
    const currentQueueStr = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!currentQueueStr) return 0;
    const queue: GooglePayTransactionDTO[] = JSON.parse(currentQueueStr);
    return queue.length;
  } catch (error) {
    console.error('Error consultando conteo de cola offline:', error);
    return 0;
  }
};

export const flushOfflineQueue = async (): Promise<{
  processed: number;
  failed: number;
}> => {
  let processed = 0;
  let failed = 0;

  try {
    const currentQueueStr = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!currentQueueStr) {
      return { processed: 0, failed: 0 };
    }

    const queue: GooglePayTransactionDTO[] = JSON.parse(currentQueueStr);
    if (queue.length === 0) {
      return { processed: 0, failed: 0 };
    }

    const remainingQueue: GooglePayTransactionDTO[] = [];

    for (const item of queue) {
      try {
        await transactionsApi.createGooglePay(item);
        processed += 1;
      } catch (error: any) {
        const status = error?.response?.status;
        const msg = (
          error?.response?.data?.details ||
          error?.response?.data?.error ||
          ''
        ).toLowerCase();

        // Si el backend responde con status 200 (deduplicada) o conflicto, se considera resuelta
        if (status === 200 || status === 409 || msg.includes('deduplicad') || msg.includes('duplicate')) {
          processed += 1;
        } else {
          failed += 1;
          remainingQueue.push(item);
        }
      }
    }

    await AsyncStorage.setItem(
      QUEUE_STORAGE_KEY,
      JSON.stringify(remainingQueue)
    );
  } catch (error) {
    console.error('Error procesando vaciado de cola offline:', error);
  }

  return { processed, failed };
};
