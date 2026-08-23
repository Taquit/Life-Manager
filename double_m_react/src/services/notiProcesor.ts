import api from "./api";

export interface NotificationData {
    title?: string;
    text: string;
    app?: string;
}

export const notiProcesor = async (notificationData: NotificationData) => {
    try {
        const { title, text, app } = notificationData;

        // Extracción del monto (Soporta "$150", "$ 150", "$1,500.00", "$ 1,500,000.00")
        const amountStr = text.match(/\$\s*[\d,]+(?:\.\d+)?/);
        const amount = amountStr ? parseFloat(amountStr[0].replace(/[^0-9.]/g, '')) : 0;

        // Extraemos los últimos 4 dígitos (soporta "**1234", "••6102", "termina en 1234")
        const cardMatch = text.match(/(?:[•*xX]{2,4}\s*|termina en\s+[*•]*\s*)(\d{4})/i);
        const cardLast4 = cardMatch ? cardMatch[1] : null;

        let cardId = null;

        if (cardLast4) {
            try {
                // Pasamos los 4 dígitos a la petición de la API
                const return_card = await api.get("/card/by_l4", { params: { l4: cardLast4 } });
                
                // Asignamos el id que regresa el backend (ajusta si viene dentro de un objeto como .data.id)
                cardId = return_card.data.id ?? return_card.data;

            } catch (error) {
                console.error("Error al buscar tarjeta", error);
            }
        }

        if (!amount && !cardId) {
            return null;
        }

        return { cardId, amount, title };

    } catch (error) {
        console.error("Error procesando la notificación:", error);
        return null;
    }
}