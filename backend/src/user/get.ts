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

    const client = new Client({
        connectionString: Resource.DATABASE_URL.value,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        // Traemos los datos del usuario, pero EXCLUIMOS el password por seguridad
        const query = `SELECT id, name, email FROM users WHERE id = $1`;
        const values = [userPayload.user_id];
        
        const result = await client.query(query, values);

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
                message: "Perfil de usuario obtenido",
                data: result.rows[0],
            }),
        };
    } catch (error) {
        console.error("Error obteniendo usuario:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Error interno en el servidor" }),
        };
    } finally {
        await client.end();
    }
};
