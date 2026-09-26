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
    const { name, email } = body;

    try {
        const updateQuery = `
            UPDATE users 
            SET 
                name = COALESCE($1, name), 
                email = COALESCE($2, email)
            WHERE id = $3 
            RETURNING id, name, email;
        `;
        const values = [name, email, userPayload.user_id];
        const result = await query(updateQuery, values);

        if (result.rows.length === 0) {
            return jsonResponse(404, { error: "Usuario no encontrado" });
        }

        return jsonResponse(200, {
            message: "Usuario actualizado correctamente",
            data: result.rows[0],
        });
    } catch (error: any) {
        console.error("Error actualizando usuario:", error);
        return jsonResponse(500, {
            error: "Error interno en el servidor",
            details: error.message
        });
    }
};
