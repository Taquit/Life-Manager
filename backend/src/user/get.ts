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

    try {
        const sql = `SELECT id, name, email FROM users WHERE id = $1`;
        const result = await query(sql, [userPayload.user_id]);

        if (result.rows.length === 0) {
            return jsonResponse(404, { error: "Usuario no encontrado" });
        }

        return jsonResponse(200, {
            message: "Perfil de usuario obtenido",
            data: result.rows[0],
        });
    } catch (error: any) {
        console.error("Error obteniendo usuario:", error);
        return jsonResponse(500, {
            error: "Error interno en el servidor",
            details: error.message
        });
    }
};
