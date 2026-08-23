import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Resource } from "sst";
import { Client } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const handler = async (event: APIGatewayProxyEventV2) => {

    const body = event.body ? JSON.parse(event.body) : {};
    const { email, password } = body;

    if (!email || !password) {
        return {
            statusCode: 400,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                error: "Email and password are required"
            })
        }
    }

    const client = new Client({
        connectionString: Resource.DATABASE_URL.value,
        ssl: { rejectUnauthorized: false }
    })

    await client.connect();

    try {
        const query = `SELECT * FROM users WHERE email = $1`;
        const values = [email];
        const result = await client.query(query, values);
        if (result.rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    error: "User not found"
                })
            }
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return {
                statusCode: 401,
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    error: "Invalid password"
                })
            }
        }

        // --- Generar Token JWT ---
        const token = jwt.sign(
            { user_id: user.id },
            Resource.JWT_SECRET.value,
            { expiresIn: "7d" } // El token expira en 7 días
        );

        return {
            statusCode: 200,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                message: "Login successful",
                token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            })
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                error: "Internal server error"
            })
        }
    } finally {
        await client.end()
    }

}