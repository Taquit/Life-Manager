import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Resource } from "sst";
import { Client } from "pg"; // Librería oficial de Node para PostgreSQL
import { verifyToken } from "../utils/auth";

export const handler = async (event: APIGatewayProxyEventV2) => {
    let userPayload;
    try {
        userPayload = verifyToken(event);
    } catch (error: any) {
        return {
            statusCode: 401,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: error.message }),
        };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const id = body.id;
    const title = body.title;
    const amount = body.amount;
    const category_id = body.category_id || null;
    const isAuto = body.isAuto ?? false;
    const card_id = body.card_id || null;
    const date = body.date;
    const user_id = userPayload.user_id; // Obtenido del token

    if (!id || !title || amount === undefined) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Faltan datos obligatorios: id, título o monto" }),
        };
    }

    const client = new Client({
        connectionString: Resource.DATABASE_URL.value,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        // Actualizamos solo los campos que se enviaron, dejando los demás intactos
        const updateQuery = `
            UPDATE transactions
            SET
                title = COALESCE($1, title),
                amount = COALESCE($2, amount),
                category_id = COALESCE($3, category_id),
                is_auto = COALESCE($4, is_auto),
                card_id = COALESCE($5, card_id),
                date = COALESCE($8, date)
            WHERE id = $6 AND user_id = $7
            RETURNING *;
        `;
        const values = [title, amount, category_id, isAuto, card_id, id, user_id, date ?? null];

        const result = await client.query(updateQuery, values);
        const updatedTransaction = result.rows[0];

        if (!updatedTransaction) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Transacción no encontrada" }),
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Transacción actualizada exitosamente",
                data: updatedTransaction
            }),
        };
    } catch (error) {
        console.error("Error actualizando en la BD:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Error interno en el servidor" }),
        };
    } finally {
        await client.end();
    }
}