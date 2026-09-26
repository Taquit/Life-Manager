import api from './api';

export interface NotificationData {
  title?: string;
  text?: string;
  app?: string;
  subText?: string;
  bigText?: string;
  [key: string]: any;
}

export interface ProcessedNotificationResult {
  success: boolean;
  amount: number;
  cardId: string | null;
  cardLast4: string | null;
  categoryId: string | null;
  title: string;
  steps: string[];
  errorMessage?: string;
}

// Mapa de nombres amigables para paquetes conocidos
export const KNOWN_PACKAGES: Record<string, string> = {
  'com.google.android.apps.walletnfcrel': 'Google Wallet',
  'com.google.android.gms': 'Google Pay Services',
  'com.nu.production': 'Nu',
  'com.bancomer.mbanking': 'BBVA',
  'com.santander.app': 'Santander',
  'com.mercadolibre': 'Mercado Pago',
  'com.mercadopago.wallet': 'Mercado Pago Wallet',
  'com.whatsapp': 'WhatsApp (Pruebas)',
};

// In-memory lock for concurrent background tasks to prevent creating duplicate categories
let autoCategoryPromise: Promise<string | null> | null = null;

export const getOrCreateAutoCategory = async (): Promise<string | null> => {
  try {
    const catsResponse = await api.get('/category');
    const categories = catsResponse.data.data || [];

    const autoCat = categories.find((c: any) => {
      if (!c.name) return false;
      const normalized = c.name
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return normalized === 'gastos automaticos';
    });

    if (!autoCat) {
      const newCat = await api.post('/category', {
        name: 'Gastos Automáticos',
        color: '#8B5CF6',
      });
      return newCat.data.data?.id || null;
    } else {
      return autoCat.id;
    }
  } catch (catError) {
    console.error('Error al obtener o crear categoría automática:', catError);
    return null;
  }
};

/**
 * Procesa la notificación cruda recibida por el sistema y extrae monto, tarjeta y comercio
 */
export const notiProcesor = async (
  notificationData: NotificationData
): Promise<ProcessedNotificationResult> => {
  const steps: string[] = [];

  try {
    const title = notificationData.title || '';
    const text = notificationData.text || '';
    const bigText = notificationData.bigText || '';
    const subText = notificationData.subText || '';
    const app = notificationData.app || '';

    // Unir todo el texto disponible para buscar patrones
    const fullContent = `${title} | ${text} | ${bigText} | ${subText}`.trim();
    steps.push(`Analizando texto de paquete '${app}': "${fullContent}"`);

    // 1. EXTRACCIÓN DEL MONTO
    // Soporta: "$150", "$ 150.00", "$1,500.50", "150.00 MXN", "150.00 pesos"
    let amount = 0;
    const amountMatch = fullContent.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/i) ||
                        fullContent.match(/([\d,]+(?:\.\d{2})?)\s*(?:mxn|pesos|usd)/i);

    if (amountMatch) {
      const rawNum = amountMatch[1].replace(/,/g, '');
      amount = parseFloat(rawNum);
      steps.push(`Monto detectado con éxito: $${amount.toFixed(2)}`);
    } else {
      steps.push('No se detectó ningún monto con formato de moneda en el texto.');
    }

    // 2. EXTRACCIÓN DE LA TARJETA (Últimos 4 dígitos)
    // Soporta: "•••• 1234", "**1234", "termina en 1234", "terminación 1234", "tarjeta 1234", "tc 1234", "visa 1234"
    const cardMatch = fullContent.match(/(?:[•*xX]{2,4}\s*|termina(?:ción| en)?\s+[*•xX]*\s*|(?:tarjeta|tc|tdc|visa|mastercard|amex)\s+[*•xX]*\s*)(\d{4})/i);
    const cardLast4 = cardMatch ? cardMatch[1] : null;

    let cardId: string | null = null;
    const appFriendlyName = KNOWN_PACKAGES[app] || app || 'Tarjeta NFC';

    if (cardLast4) {
      steps.push(`Dígitos de tarjeta detectados: terminación ${cardLast4}`);
      try {
        // Buscar si ya existe la tarjeta en el backend
        const return_card = await api.get('/card/by_l4', { params: { l4: cardLast4 } });
        cardId = return_card.data.id ?? return_card.data?.data?.id ?? null;
        steps.push(`Tarjeta existente vinculada (ID: ${cardId})`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          steps.push(`Tarjeta con terminación ${cardLast4} no encontrada. Registrando automáticamente...`);
          try {
            const newCard = await api.post('/card', {
              bankname: appFriendlyName,
              alias: `Tarjeta ${cardLast4}`,
              last4: cardLast4,
            });
            cardId = newCard.data.data?.id || null;
            steps.push(`Nueva tarjeta creada automáticamente (ID: ${cardId})`);
          } catch (postError: any) {
            steps.push(`Error al crear tarjeta automática: ${postError.message}`);
          }
        } else {
          steps.push(`Error al consultar tarjeta: ${error.message}`);
        }
      }
    } else {
      steps.push('No se detectaron los últimos 4 dígitos de tarjeta.');
    }

    // 3. EXTRACCIÓN DEL NOMBRE DEL COMERCIO O TÍTULO DE LA TRANSACCIÓN
    let transactionTitle = '';

    // Si en el texto dice "en [Comercio]" o "a [Comercio]" (e.g. "Pagaste $150 en OXXO")
    const merchantMatch = text.match(/(?:en|a|de)\s+([A-Z0-9a-zÀ-ÿ\s.\-&]{2,25})(?:\s+con|\s+\$|\s+el|\s+por|$)/i);
    if (merchantMatch && merchantMatch[1]) {
      transactionTitle = merchantMatch[1].trim();
    } else if (title && !title.toLowerCase().includes('google') && !title.toLowerCase().includes('wallet')) {
      transactionTitle = title.trim();
    }

    if (!transactionTitle) {
      transactionTitle = `Pago NFC (${appFriendlyName})`;
    }
    steps.push(`Título de transacción asignado: "${transactionTitle}"`);

    // Validar si tenemos información suficiente para guardar
    if (!amount || amount <= 0) {
      return {
        success: false,
        amount: 0,
        cardId,
        cardLast4,
        categoryId: null,
        title: transactionTitle,
        steps,
        errorMessage: 'La notificación no contiene un monto válido mayor a 0.',
      };
    }

    // 4. ASIGNACIÓN DE CATEGORÍA
    if (!autoCategoryPromise) {
      autoCategoryPromise = getOrCreateAutoCategory().finally(() => {
        autoCategoryPromise = null;
      });
    }
    const categoryId = await autoCategoryPromise;
    steps.push(`Categoría asignada: Gastos Automáticos (ID: ${categoryId})`);

    return {
      success: true,
      amount,
      cardId,
      cardLast4,
      categoryId,
      title: transactionTitle,
      steps,
    };
  } catch (error: any) {
    console.error('Error procesando la notificación:', error);
    steps.push(`Excepción fatal en notiProcesor: ${error.message}`);
    return {
      success: false,
      amount: 0,
      cardId: null,
      cardLast4: null,
      categoryId: null,
      title: 'Error',
      steps,
      errorMessage: error.message,
    };
  }
};