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
    const name = body.name;
    const color = body.color;
    const user_id = userPayload.user_id; // Obtenido del token

    if (!name || !color || !user_id) {
        return {
            statusCode: 400,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                error: "Faltan datos obligatorios"
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
            CREATE TABLE IF NOT EXISTS public.category (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                name text NOT NULL,
                color text NOT NULL,
                user_id uuid NOT NULL,
                CONSTRAINT category_pkey PRIMARY KEY (id),
                CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES public.users(id)
            );
        `);

        const insertQuery = `INSERT INTO category (name, color, user_id) VALUES ($1, $2, $3)
        RETURNING *;
        `;
        const values = [name, color, user_id];

        const result = await client.query(insertQuery, values);
        const savedCategory = result.rows[0];

        return {
            statusCode: 201,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                message: "Categoría creada correctamente",
                data: savedCategory
            })
        }

    } catch (error) {
        console.error("Error creando categoría:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                error: "Error interno del servidor"
            })
        }
    } finally {
        await client.end();
    }

}