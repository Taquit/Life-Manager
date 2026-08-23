import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Resource } from "sst";
import { Client } from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export const handler = async (event: APIGatewayProxyEventV2) => {
    const body = event.body ? JSON.parse(event.body) : {};
    const name = body.name;
    const email = body.email;
    const password = body.password;
    const id = randomUUID(); // Generamos el ID aquí automáticamente

    if (!name || !email || !password) {
        return {
            statusCode: 400,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                error: "Faltan datos obligatorios"
            })
        }
    }

    let client;
    try {
        client = new Client({
            connectionString: Resource.DATABASE_URL.value,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        const query = `CREATE TABLE IF NOT EXISTS public.users (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            name text NOT NULL,
            email text NOT NULL UNIQUE,
            password text NOT NULL,
            CONSTRAINT users_pkey PRIMARY KEY (id)
        );`
        await client.query(query);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const insertQuery = `
            INSERT INTO users (id, name, email, password) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;
        const values = [id, name, email, hashedPassword];
        const result = await client.query(insertQuery, values);
        const savedUser = result.rows[0];

        // Es una buena práctica no devolver la contraseña (ni siquiera el hash) en la respuesta
        delete savedUser.password;
        return {
            statusCode: 201,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                message: "Usuario creado correctamente",
                data: savedUser
            })
        }
    } catch (error: any) {
        console.error("Error creando usuario:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                error: "Error: " + error.message
            })
        }
    } finally {
        if (client) {
            await client.end();
        }
    }
}