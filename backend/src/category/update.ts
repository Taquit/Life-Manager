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
    const name = body.name;
    const color = body.color;
    const user_id = userPayload.user_id;

    if (!id || !name || !user_id) {
        return jsonResponse(400, {
            error: "Faltan datos obligatorios (id, name)"
        });
    }

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
        const result = await query(updateQuery, values);
        const updatedCategory = result.rows[0];

        if (!updatedCategory) {
            return jsonResponse(404, {
                error: "Categoría no encontrada o no pertenece al usuario"
            });
        }

        return jsonResponse(200, {
            message: "Categoría actualizada correctamente",
            data: updatedCategory
        });
    } catch (error: any) {
        console.error("Error actualizando categoría:", error);
        return jsonResponse(500, {
            error: "Error interno del servidor",
            details: error.message
        });
    }
};
