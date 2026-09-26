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
    const queryStringParameters = event.queryStringParameters || {};
    const last4 = queryStringParameters.l4 || queryStringParameters.last4;

    if (!user_id) {
        return jsonResponse(400, { error: "Falta el user_id en el token" });
    }

    if (!last4) {
        return jsonResponse(400, { error: "Falta el parámetro last4 (o l4)" });
    }

    try {
        const searchCardQuery = `
            SELECT id, bankname, alias, last4
            FROM card 
            WHERE last4 = $1 
            AND user_id = $2
            LIMIT 1;
        `;
        const values = [last4, user_id];
        const result = await query(searchCardQuery, values);

        if (result.rows.length === 0) {
            return jsonResponse(404, { error: "Tarjeta no encontrada" });
        }

        const card = result.rows[0];

        return jsonResponse(200, {
            message: "Tarjeta obtenida correctamente",
            id: card.id,
            data: card
        });
    } catch (error: any) {
        console.error("Error al buscar tarjeta por last4:", error);
        return jsonResponse(500, {
            error: "Error interno del servidor",
            details: error.message
        });
    }
};