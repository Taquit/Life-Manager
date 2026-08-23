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
    const id = body.id;
    const user_id = userPayload.user_id;


    if (!id) {
        return {
            statusCode: 400,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Falta el id de la tarjeta"
            })
        }
    }

    const client = new Client({
        connectionString: Resource.DATABASE_URL.value,
        ssl: { rejectUnauthorized: false }
    })

    await client.connect();

    try {
        const deleteQuery = `DELETE FROM card WHERE id = $1 AND user_id = $2`;
        const values = [id, user_id];

        await client.query(deleteQuery, values);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Tarjeta eliminada correctamente",
            }),
        }

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