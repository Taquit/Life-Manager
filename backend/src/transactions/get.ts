
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
    const id = body.id || (event.queryStringParameters && event.queryStringParameters.id);
    const user_id = userPayload.user_id;

    const client = new Client({
        connectionString: Resource.DATABASE_URL.value,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        if (id) {
            // Obtener una sola transacción si se provee el ID
            const getQuery = `SELECT * FROM transactions WHERE id = $1 AND user_id = $2`;
            const values = [id, user_id];

            const result = await client.query(getQuery, values);
            const data = result.rows[0];

            return {
                statusCode: 200,
                headers: { "Content-type": "application/json" },
                body: JSON.stringify({
                    message: "Transaccion obtenida correctamente",
                    data
                })
            };
        } else {
            // Obtener TODAS las transacciones del usuario (Lo que necesita tu app)
            const getQuery = `SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC`;
            const values = [user_id];

            const result = await client.query(getQuery, values);
            const data = result.rows; // Devuelve el array completo

            return {
                statusCode: 200,
                headers: { "Content-type": "application/json" },
                body: JSON.stringify({
                    message: "Transacciones obtenidas correctamente",
                    data
                })
            };
        }
    } catch (err) {
        return {
            statusCode: 500,
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ error: "Error interno del servidor" })
        };
    } finally {
        await client.end();
    }
}
