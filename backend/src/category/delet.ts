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
    const id = body.id || (event.queryStringParameters && event.queryStringParameters.id) || (event.pathParameters && event.pathParameters.id);
    const user_id = userPayload.user_id;

    if (!id) {
        return jsonResponse(400, {
            error: "Falta el id de la categoría"
        });
    }

    try {
        // Desvincular transacciones con esta categoría para evitar error de foreign key
        await query(`UPDATE transactions SET category_id = NULL WHERE category_id = $1 AND user_id = $2`, [id, user_id]);

        const deleteQuery = `DELETE FROM category WHERE id = $1 AND user_id = $2 RETURNING id`;
        const result = await query(deleteQuery, [id, user_id]);

        if (result.rows.length === 0) {
            return jsonResponse(404, {
                error: "Categoría no encontrada o no pertenece al usuario"
            });
        }

        return jsonResponse(200, {
            message: "Categoría eliminada correctamente",
            id
        });
    } catch (error: any) {
        console.error("Error eliminando categoría:", error);
        return jsonResponse(500, {
            error: "Error interno del servidor",
            details: error.message
        });
    }
};