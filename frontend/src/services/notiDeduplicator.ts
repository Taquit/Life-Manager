import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@moneyapp_recent_gpay_notis';
const DEDUPLICATION_WINDOW_MS = 2 * 60 * 1000; // 2 minutos

interface RecentNotification {
  amount: number;
  cardLast4: string;
  timestamp: number;
}

export const isDuplicateNotification = async (
  amount: number,
  cardLast4: string
): Promise<boolean> => {
  try {
    const now = Date.now();
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    let items: RecentNotification[] = stored ? JSON.parse(stored) : [];

    // Limpiar entradas que superen la ventana de 2 minutos
    items = items.filter((item) => now - item.timestamp < DEDUPLICATION_WINDOW_MS);

    // Comprobar si existe un registro identico dentro de la ventana
    const isDuplicate = items.some(
      (item) => item.amount === amount && item.cardLast4 === cardLast4
    );

    if (isDuplicate) {
      return true;
    }

    // Registrar la notificacion actual
    items.unshift({ amount, cardLast4, timestamp: now });
    if (items.length > 50) {
      items.length = 50;
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return false;
  } catch (error) {
    console.error('Error en notiDeduplicator:', error);
    return false;
  }
};
