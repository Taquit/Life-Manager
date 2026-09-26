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
    const bankname = body.bankname;
    const alias = body.alias;
    const last4 = body.last4;
    const user_id = userPayload.user_id;

    if (!bankname || !alias || !last4 || !user_id) {
        return jsonResponse(400, {
            message: "Faltan datos obligatorios (bankname, alias, last4)"
        });
    }

    try {
        const insertQuery = `
            INSERT INTO card (bankname, alias, last4, user_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [bankname, alias, last4, user_id];
        const result = await query(insertQuery, values);
        const savedCard = result.rows[0];

        return jsonResponse(201, {
            message: "Tarjeta creada exitosamente",
            data: savedCard,
        });
    } catch (err: any) {
        console.error("Error al crear tarjeta:", err);
        return jsonResponse(500, {
            message: "Error interno del servidor",
            details: err.message
        });
    }
};