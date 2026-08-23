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
    const { name, email } = body;

    const client = new Client({
        connectionString: Resource.DATABASE_URL.value,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        // Actualizamos name y email si vienen en el body (usando COALESCE)
        const updateQuery = `
            UPDATE users 
            SET 
                name = COALESCE($1, name), 
                email = COALESCE($2, email)
            WHERE id = $3 
            RETURNING id, name, email;
        `;
        const values = [name, email, userPayload.user_id];

        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Usuario no encontrado" }),
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Usuario actualizado correctamente",
                data: result.rows[0],
            }),
        };
    } catch (error) {
        console.error("Error actualizando usuario:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Error interno en el servidor" }),
        };
    } finally {
        await client.end();
    }
};
