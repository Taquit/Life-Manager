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

    if (!user_id) {
        return {
            statusCode: 400,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                error: "Falta el user_id"
            })
        }
    }

    const client = new Client({
        connectionString: Resource.DATABASE_URL.value,
        ssl: { rejectUnauthorized: false }
    })

    await client.connect();

    try {

        const getQuery = `SELECT * FROM card WHERE user_id = $1`;
        const values = [user_id];

        const result = await client.query(getQuery, values);
        const data = result.rows;

        return {
            statusCode: 200,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                message: "Tarjetas obtenidas correctamente",
                data
            })
        }
    } catch (err) {
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