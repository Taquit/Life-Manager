import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Resource } from "sst";
import { Client } from "pg"; // Librería oficial de Node para PostgreSQL
import { verifyToken } from "../utils/auth";

export const handler = async (event: APIGatewayProxyEventV2) => {

    let userPayload;
    try {
        userPayload = verifyToken(event);
    } catch (error: any) {
        return {
            statusCode: 401,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: error.message }),
        };
    }

    // 1. Extraer los datos
    const body = event.body ? JSON.parse(event.body) : {};
    const title = body.title;
    const amount = body.amount;
    const category_id = body.category_id || null;
    const isAuto = body.isAuto ?? false;
    const card_id = body.card_id || null;
    const date = body.date; // Puede ser undef
    const user_id = userPayload.user_id; // Obtenido del token de forma segura

    if (!title || amount === undefined) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Faltan datos obligatorios: título o monto" }),
        };
    }

    // 2. Configurar la conexión a tu base de datos externa (Supabase)
    const client = new Client({
        connectionString: Resource.DATABASE_URL.value,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        // [TRUCO PARA EMPEZAR]: Creamos la tabla automáticamente si no existe. 
        // Cuando tu app crezca, esto se saca de aquí y se hace con herramientas como Prisma o Drizzle.
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.transactions (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                title text NOT NULL,
                amount numeric NOT NULL,
                category_id uuid,
                is_auto boolean DEFAULT false,
                card_id uuid,
                user_id uuid,
                date timestamp without time zone DEFAULT now(),
                CONSTRAINT transactions_pkey PRIMARY KEY (id),
                CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES public.users(id),
                CONSTRAINT fk_transactions_card FOREIGN KEY (card_id) REFERENCES public.card(id),
                CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) REFERENCES public.category(id)
            );
        `);

        // 3. Insertar la nueva transacción de forma segura (usando $1, $2 para evitar hackeos/inyección SQL)
        const insertQuery = date 
            ? `INSERT INTO transactions (title, amount, category_id, is_auto, card_id, user_id, date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`
            : `INSERT INTO transactions (title, amount, category_id, is_auto, card_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        const values = date 
            ? [title, amount, category_id, isAuto, card_id, user_id, date]
            : [title, amount, category_id, isAuto, card_id, user_id];

        const result = await client.query(insertQuery, values);
        const savedTransaction = result.rows[0];

        // 4. Devolver la respuesta a Flutter
        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Transacción guardada exitosamente en PostgreSQL",
                data: savedTransaction
            }),
        };
    } catch (error) {
        console.error("Error guardando en la BD:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Error interno en el servidor" }),
        };
    } finally {
        // MUY IMPORTANTE EN LAMBDAS: Siempre cerrar la conexión al final
        await client.end();
    }
};
