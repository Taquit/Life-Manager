import api from "./api";

export interface NotificationData {
    title?: string;
    text: string;
    app?: string;
}

// In-memory lock for concurrent background tasks to prevent creating multiple categories
let autoCategoryPromise: Promise<string | null> | null = null;

const getOrCreateAutoCategory = async (): Promise<string | null> => {
    try {
        const catsResponse = await api.get("/category");
        const categories = catsResponse.data.data || [];
        
        let autoCat = categories.find((c: any) => {
            if (!c.name) return false;
            // Normalize to remove accents and lower case for robust matching
            const normalized = c.name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return normalized === 'gastos automaticos';
        });
        
        if (!autoCat) {
            const newCat = await api.post("/category", {
                name: "Gastos Automáticos",
                color: "#8B5CF6" // Un color morado por defecto
            });
            return newCat.data.data?.id || null;
        } else {
            return autoCat.id;
        }
    } catch (catError) {
        console.error("Error al obtener o crear categoría automática:", catError);
        return null;
    }
};

export const notiProcesor = async (notificationData: NotificationData) => {
    try {
        const { title, text, app } = notificationData;

        // Extracción del monto (Soporta "$150", "$ 150", "$1,500.00", "$ 1,500,000.00")
        const amountStr = text.match(/\$\s*[\d,]+(?:\.\d+)?/);
        const amount = amountStr ? parseFloat(amountStr[0].replace(/[^0-9.]/g, '')) : 0;

        // Extraemos los últimos 4 dígitos (soporta "**1234", "••6102", "termina en 1234", "terminación 6102", "tarjeta 1234", "tc 1234")
        const cardMatch = text.match(/(?:[•*xX]{2,4}\s*|termina(?:ción| en)?\s+[*•]*\s*|(?:tarjeta|tc|tdc)\s+[*•xX]*\s*)(\d{4})/i);
        const cardLast4 = cardMatch ? cardMatch[1] : null;

        let cardId = null;

        if (cardLast4) {
            try {
                // Pasamos los 4 dígitos a la petición de la API
                const return_card = await api.get("/card/by_l4", { params: { l4: cardLast4 } });
                
                // Asignamos el id que regresa el backend
                cardId = return_card.data.id ?? return_card.data;

            } catch (error: any) {
                if (error.response?.status === 404) {
                    // La tarjeta no existe, la registramos automáticamente
                    try {
                        const newCard = await api.post("/card", {
                            bankname: app || "Desconocido",
                            alias: `Tarjeta ${cardLast4}`,
                            last4: cardLast4
                        });
                        cardId = newCard.data.data?.id;
                    } catch (postError) {
                        console.error("Error al registrar tarjeta automáticamente", postError);
                    }
                } else {
                    console.error("Error al buscar tarjeta", error);
                }
            }
        }

        if (!amount && !cardId) {
            return null;
        }

        let categoryId = null;
        if (!autoCategoryPromise) {
            autoCategoryPromise = getOrCreateAutoCategory().finally(() => {
                autoCategoryPromise = null; // Clean up the lock once done
            });
        }
        categoryId = await autoCategoryPromise;

        return { cardId, amount, title, categoryId };

    } catch (error) {
        console.error("Error procesando la notificación:", error);
        return null;
    }
}