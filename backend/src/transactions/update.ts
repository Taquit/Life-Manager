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
    const title = body.title;
    const amount = body.amount;
    const category_id = body.category_id !== undefined ? body.category_id : null;
    const isAuto = body.isAuto !== undefined ? body.isAuto : (body.is_auto !== undefined ? body.is_auto : false);
    const card_id = body.card_id !== undefined ? body.card_id : null;
    const date = body.date;
    const user_id = userPayload.user_id;

    if (!id) {
        return jsonResponse(400, {
            error: "Falta el id de la transacción"
        });
    }

    try {
        const updateQuery = `
            UPDATE transactions
            SET
                title = COALESCE($1, title),
                amount = COALESCE($2, amount),
                category_id = COALESCE($3, category_id),
                is_auto = COALESCE($4, is_auto),
                card_id = COALESCE($5, card_id),
                date = COALESCE($8, date)
            WHERE id = $6 AND user_id = $7
            RETURNING *;
        `;
        const values = [title, amount !== undefined ? Number(amount) : null, category_id, isAuto, card_id, id, user_id, date ?? null];
        const result = await query(updateQuery, values);
        const updatedTransaction = result.rows[0];

        if (!updatedTransaction) {
            return jsonResponse(404, { error: "Transacción no encontrada o no pertenece al usuario" });
        }

        return jsonResponse(200, {
            message: "Transacción actualizada exitosamente",
            data: updatedTransaction
        });
    } catch (error: any) {
        console.error("Error actualizando transacción en la BD:", error);
        return jsonResponse(500, {
            error: "Error interno en el servidor",
            details: error.message
        });
    }
};