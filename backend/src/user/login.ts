import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Resource } from "sst";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, jsonResponse } from "../utils/db";

export const handler = async (event: APIGatewayProxyEventV2) => {
    const body = event.body ? JSON.parse(event.body) : {};
    const { email, password } = body;

    if (!email || !password) {
        return jsonResponse(400, {
            error: "Email and password are required"
        });
    }

    try {
        const sql = `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`;
        const result = await query(sql, [email.trim()]);
        
        if (result.rows.length === 0) {
            return jsonResponse(404, {
                error: "Usuario no encontrado"
            });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return jsonResponse(401, {
                error: "Contraseña incorrecta"
            });
        }

        // Generar Token JWT válido por 7 días
        const token = jwt.sign(
            { user_id: user.id },
            Resource.JWT_SECRET.value,
            { expiresIn: "7d" }
        );

        return jsonResponse(200, {
            message: "Login exitoso",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error: any) {
        console.error("Error en login:", error);
        return jsonResponse(500, {
            error: "Error interno del servidor en inicio de sesión",
            details: error.message
        });
    }
};