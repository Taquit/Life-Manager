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
        const deleteQuery = `DELETE FROM users WHERE id = $1`;
        const values = [userPayload.user_id];

        await client.query(deleteQuery, values);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Cuenta de usuario eliminada correctamente",
            }),
        };
    } catch (error) {
        console.error("Error eliminando usuario:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Error interno en el servidor" }),
        };
    } finally {
        await client.end();
    }
};
