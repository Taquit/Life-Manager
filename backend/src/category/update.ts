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
    const name = body.name;
    const color = body.color;
    const user_id = userPayload.user_id;

    if (!id || !name || !color || !user_id) {
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
        const updateQuery = `
            UPDATE category 
            SET 
                name = COALESCE($1, name), 
                color = COALESCE($2, color) 
            WHERE id = $3 AND user_id = $4 
            RETURNING *;
        `;
        const values = [name, color, id, user_id];

        const result = await client.query(updateQuery, values);
        const updatedCategory = result.rows[0];

        if (!updatedCategory) {
            return {
                statusCode: 404,
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    error: "Categoría no encontrada"
                })
            }
        }

        return {
            statusCode: 200,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                message: "Categoría actualizada correctamente",
                data: updatedCategory
            })
        }
    } catch (error) {
        console.error("Error actualizando categoría:", error);
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
