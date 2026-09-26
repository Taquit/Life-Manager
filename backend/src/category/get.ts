import { APIGatewayProxyEventV2 } from "aws-lambda";
import { verifyToken } from "../utils/auth";
import { query, jsonResponse } from "../utils/db";

export const handler = async (event: APIGatewayProxyEventV2) => {
    let userPayload;
    try {
        userPayload = verifyToken(event);
    } catch (error: any) {
        return jsonResponse(401, { error: error.message });
    }

    const user_id = userPayload.user_id;
    if (!user_id) {
        return jsonResponse(400, { error: "Falta el user_id" });
    }

    try {
        const getQuery = `SELECT * FROM category WHERE user_id = $1 ORDER BY id DESC`;
        const result = await query(getQuery, [user_id]);

        return jsonResponse(200, {
            message: "Categorías obtenidas correctamente",
            data: result.rows
        });
    } catch (error: any) {
        console.error("Error obteniendo categorías:", error);
        return jsonResponse(500, {
            error: "Error interno del servidor",
            details: error.message
        });
    }
};