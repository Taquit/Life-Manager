import { APIGatewayProxyEventV2 } from "aws-lambda";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { query, jsonResponse } from "../utils/db";

export const handler = async (event: APIGatewayProxyEventV2) => {
    const body = event.body ? JSON.parse(event.body) : {};
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const id = randomUUID();

    if (!name || !email || !password) {
        return jsonResponse(400, {
            error: "Faltan datos obligatorios (nombre, correo y contraseña)"
        });
    }

    try {
        // Verificar si el correo ya existe
        const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
        if (existing.rows.length > 0) {
            return jsonResponse(409, {
                error: "El correo electrónico ya está registrado"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const insertQuery = `
            INSERT INTO users (id, name, email, password) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, name, email;
        `;
        const values = [id, name, email, hashedPassword];
        const result = await query(insertQuery, values);
        const savedUser = result.rows[0];

        return jsonResponse(201, {
            message: "Usuario creado correctamente",
            data: savedUser
        });
    } catch (error: any) {
        console.error("Error creando usuario:", error);
        return jsonResponse(500, {
            error: "Error interno del servidor al crear usuario",
            details: error.message
        });
    }
};