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
    const name = body.name;
    const color = body.color || "#8B5CF6";
    const user_id = userPayload.user_id;

    if (!name || !user_id) {
        return jsonResponse(400, {
            error: "Faltan datos obligatorios (nombre de la categoría)"
        });
    }

    try {
        const insertQuery = `
            INSERT INTO category (name, color, user_id) 
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [name, color, user_id];
        const result = await query(insertQuery, values);
        const savedCategory = result.rows[0];

        return jsonResponse(201, {
            message: "Categoría creada correctamente",
            data: savedCategory
        });
    } catch (error: any) {
        console.error("Error creando categoría:", error);
        return jsonResponse(500, {
            error: "Error interno del servidor al crear categoría",
            details: error.message
        });
    }
};