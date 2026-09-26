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
    const title = body.title;
    const amount = body.amount;
    const category_id = body.category_id || null;
    const isAuto = body.isAuto ?? body.is_auto ?? false;
    const card_id = body.card_id || null;
    const date = body.date || new Date().toISOString();
    const user_id = userPayload.user_id;

    if (!title || amount === undefined || isNaN(Number(amount))) {
        return jsonResponse(400, {
            error: "Faltan datos obligatorios: título o monto válido"
        });
    }

    try {
        const insertQuery = `
            INSERT INTO transactions (title, amount, category_id, is_auto, card_id, user_id, date) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *;
        `;
        const values = [title, Number(amount), category_id, isAuto, card_id, user_id, date];
        const result = await query(insertQuery, values);
        const savedTransaction = result.rows[0];

        return jsonResponse(201, {
            message: "Transacción guardada exitosamente",
            data: savedTransaction
        });
    } catch (error: any) {
        console.error("Error guardando transacción en la BD:", error);
        return jsonResponse(500, {
            error: "Error interno en el servidor",
            details: error.message
        });
    }
};
