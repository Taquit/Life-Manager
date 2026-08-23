import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Resource } from "sst";
import { Client } from "pg";
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

    const body = event.body ? JSON.parse(event.body) : {};
    const bankname = body.bankname;
    const alias = body.alias;
    const last4 = body.last4;
    const user_id = userPayload.user_id; // Obtenido del token

    if (!bankname || !alias || !last4 || !user_id) {
        return {
            statusCode: 400,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Faltan datos obligatorios"
            })
        }
    }

    const client = new Client({
        connectionString: Resource.DATABASE_URL.value,
        ssl: { rejectUnauthorized: false }
    })

    await client.connect();

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.card (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                bankname text NOT NULL,
                alias text NOT NULL,
                last4 text NOT NULL,
                user_id uuid NOT NULL,
                CONSTRAINT card_pkey PRIMARY KEY (id),
                CONSTRAINT fk_card_user FOREIGN KEY (user_id) REFERENCES public.users(id)
            );
        `);

        const insertQuery = `
            INSERT INTO card (bankname, alias, last4, user_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const values = [bankname, alias, last4, user_id];

        const result = await client.query(insertQuery, values);
        const savedCard = result.rows[0];

        return {
            statusCode: 201,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Tarjeta creada exitosamente",
                data: savedCard,
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Error interno del servidor"
            })
        }
    } finally {
        await client.end();
    }
}