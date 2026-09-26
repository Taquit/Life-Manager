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

    const body = event.body ? JSON.parse(event.body) : {};
    const id = body.id || (event.queryStringParameters && event.queryStringParameters.id);
    const user_id = userPayload.user_id;

    try {
        if (id) {
            // Obtener una sola transacción si se provee el ID
            const getQuery = `SELECT * FROM transactions WHERE id = $1 AND user_id = $2`;
            const result = await query(getQuery, [id, user_id]);
            const data = result.rows[0];

            if (!data) {
                return jsonResponse(404, { error: "Transacción no encontrada" });
            }

            return jsonResponse(200, {
                message: "Transacción obtenida correctamente",
                data
            });
        } else {
            // Obtener TODAS las transacciones del usuario ordenadas por fecha descendente
            const getQuery = `SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, id DESC`;
            const result = await query(getQuery, [user_id]);

            return jsonResponse(200, {
                message: "Transacciones obtenidas correctamente",
                data: result.rows
            });
        }
    } catch (err: any) {
        console.error("Error al obtener transacciones:", err);
        return jsonResponse(500, {
            error: "Error interno del servidor",
            details: err.message
        });
    }
};
