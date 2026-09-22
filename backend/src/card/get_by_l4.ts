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

    const user_id = userPayload.user_id;
    const queryStringParameters = event.queryStringParameters || {};
    const last4 = queryStringParameters.l4 || queryStringParameters.last4;

    if (!user_id) {
        return {
            statusCode: 400,
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ error: "Falta el user_id en el token" })
        }
    }

    if (!last4) {
        return {
            statusCode: 400,
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ error: "Falta el parámetro last4" })
        }
    }

    const client = new Client({
        connectionString: Resource.DATABASE_URL.value,
        ssl: { rejectUnauthorized: false }
    })

    await client.connect();

    try {
        const searchCardQuery = `
            SELECT id
            FROM card 
            WHERE last4 = $1 
            AND user_id = $2;
        `;
        const values = [last4, user_id];
        const result = await client.query(searchCardQuery, values);

        if (result.rows.length === 0) {
            return {
                statusCode: 404,
                headers: { "Content-type": "application/json" },
                body: JSON.stringify({ error: "Tarjeta no encontrada" })
            }
        }

        const card_id = result.rows[0].id;

        return {
            statusCode: 200,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                message: "Tarjeta obtenida correctamente",
                id: card_id
            })
        }
    } catch (error: any) {
        return {
            statusCode: 500,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                error: "Error interno del servidor",
                details: error.message
            })
        }
    } finally {
        await client.end();
    }

}