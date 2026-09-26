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
        const user_id = userPayload.user_id;

        // Limpiar registros relacionados antes de borrar el usuario
        await query(`DELETE FROM transactions WHERE user_id = $1`, [user_id]);
        await query(`DELETE FROM card WHERE user_id = $1`, [user_id]);
        await query(`DELETE FROM category WHERE user_id = $1`, [user_id]);
        await query(`DELETE FROM users WHERE id = $1`, [user_id]);

        return jsonResponse(200, {
            message: "Cuenta de usuario y datos asociados eliminados correctamente",
        });
    } catch (error: any) {
        console.error("Error eliminando usuario:", error);
        return jsonResponse(500, {
            error: "Error interno en el servidor",
            details: error.message
        });
    }
};
