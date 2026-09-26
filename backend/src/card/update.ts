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
    const bankname = body.bankname;
    const alias = body.alias;
    const last4 = body.last4;
    const user_id = userPayload.user_id;

    if (!id) {
        return jsonResponse(400, {
            message: "Falta el id de la tarjeta"
        });
    }

    try {
        const updateQuery = `
            UPDATE card
            SET
                bankname = COALESCE($1, bankname),
                alias = COALESCE($2, alias),
                last4 = COALESCE($3, last4)
            WHERE id = $4 AND user_id = $5
            RETURNING *;
        `;
        const values = [bankname, alias, last4, id, user_id];
        const result = await query(updateQuery, values);

        if (result.rows.length === 0) {
            return jsonResponse(404, {
                message: "Tarjeta no encontrada o no pertenece al usuario"
            });
        }

        return jsonResponse(200, {
            message: "Tarjeta actualizada correctamente",
            data: result.rows[0]
        });
    } catch (err: any) {
        console.error("Error al actualizar tarjeta:", err);
        return jsonResponse(500, {
            message: "Error interno del servidor",
            details: err.message
        });
    }
};