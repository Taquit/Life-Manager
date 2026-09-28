import { Hono } from "hono";
import { query, getTables } from "../db";
import { authMiddleware } from "../middleware/auth";
import { CardDTO, CreateCardDTO, UpdateCardDTO, AppEnv } from "../types";

export const cardRoutes = new Hono<AppEnv>();

cardRoutes.use("*", authMiddleware);

function mapCardRow(row: any): CardDTO {
  return {
    id: String(row.id),
    userId: row.user_id,
    alias: row.alias ?? null,
    banco: row.banco || row.bankname || "General",
    type: row.type || "debito",
    last4: row.last_4 || row.last4 || "",
    color: row.color || "#7C3AED",
    linkedGoogle: Boolean(row.linked_google),
    cutDay: row.cut_day !== null && row.cut_day !== undefined ? Number(row.cut_day) : null,
    payDay: row.pay_day !== null && row.pay_day !== undefined ? Number(row.pay_day) : null,
  };
}

// GET /card/by_l4 (Busqueda para integracion Google Pay)
cardRoutes.get("/by_l4", async (c) => {
  const userId = c.get("userId");
  const last4 = c.req.query("last4") || c.req.query("l4");

  if (!last4) {
    return c.json({ error: "Falta el parametro last4" }, 400);
  }

  try {
    const { cardTable } = await getTables();
    const result = await query(
      `SELECT * FROM ${cardTable} WHERE (last_4 = $1 OR last4 = $1) AND user_id = $2;`,
      [last4, userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: "Tarjeta no encontrada" }, 404);
    }

    const card = mapCardRow(result.rows[0]);
    return c.json({
      message: "Tarjeta obtenida correctamente",
      id: card.id,
      data: card,
    });
  } catch (err: any) {
    return c.json({ error: "Error interno del servidor", details: err.detail || err.message }, 500);
  }
});

// GET /card/:id
cardRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  try {
    const { cardTable } = await getTables();
    const result = await query(
      `SELECT * FROM ${cardTable} WHERE id = $1 AND user_id = $2;`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: "Tarjeta no encontrada" }, 404);
    }

    const card = mapCardRow(result.rows[0]);
    return c.json({
      message: "Tarjeta obtenida correctamente",
      data: card,
    });
  } catch (err: any) {
    return c.json({ error: "Error obteniendo tarjeta", details: err.detail || err.message }, 500);
  }
});

// GET /card
cardRoutes.get("/", async (c) => {
  const userId = c.get("userId");

  try {
    const { cardTable } = await getTables();
    const result = await query(
      `SELECT * FROM ${cardTable} WHERE user_id = $1 ORDER BY id ASC;`,
      [userId]
    );

    const cards = result.rows.map(mapCardRow);
    return c.json({
      message: "Tarjetas obtenidas correctamente",
      data: cards,
    });
  } catch (err: any) {
    return c.json({ error: "Error obteniendo tarjetas", details: err.detail || err.message }, 500);
  }
});

// POST /card
cardRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body: CreateCardDTO = await c.req.json().catch(() => ({} as any));

  const alias = body.alias ?? null;
  const banco = body.banco || body.bankname;
  const last4 = body.last4 || body.last_4;
  const type = body.type || "debito";
  const color = body.color || "#7C3AED";
  const linkedGoogle = body.linkedGoogle ?? body.linked_google ?? false;
  const cutDay = body.cutDay ?? body.cut_day ?? null;
  const payDay = body.payDay ?? body.pay_day ?? null;

  if (!banco || !last4) {
    return c.json({ error: "Faltan datos obligatorios: banco y last4" }, 400);
  }

  try {
    const { cardTable } = await getTables();
    const insertQuery = `
      INSERT INTO ${cardTable} (user_id, alias, banco, bankname, type, last_4, last4, color, linked_google, cut_day, pay_day)
      VALUES ($1, $2, $3, $3, $4, $5, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [userId, alias, banco, type, last4, color, linkedGoogle, cutDay, payDay];
    const result = await query(insertQuery, values);
    const saved = result.rows[0];

    return c.json(
      {
        message: "Tarjeta creada exitosamente",
        data: mapCardRow(saved),
      },
      201
    );
  } catch (err: any) {
    return c.json({ error: "Error creando tarjeta", details: err.detail || err.message }, 500);
  }
});

// PUT /card / PUT /card/:id
const updateCardHandler = async (c: any) => {
  const userId = c.get("userId");
  const paramId = c.req.param("id");
  const body: UpdateCardDTO & { id?: string | number } = await c.req.json().catch(() => ({} as any));
  const id = paramId || body.id;

  if (!id) {
    return c.json({ error: "Falta el id de la tarjeta" }, 400);
  }

  const alias = body.alias !== undefined ? body.alias : null;
  const banco = body.banco || body.bankname;
  const last4 = body.last4 || body.last_4;
  const linkedGoogle = body.linkedGoogle ?? body.linked_google;
  const cutDay = body.cutDay ?? body.cut_day;
  const payDay = body.payDay ?? body.pay_day;

  try {
    const { cardTable } = await getTables();
    const updateQuery = `
      UPDATE ${cardTable}
      SET
        alias = CASE WHEN $1::boolean THEN $2 ELSE alias END,
        banco = COALESCE($3, banco),
        bankname = COALESCE($3, bankname),
        type = COALESCE($4, type),
        last_4 = COALESCE($5, last_4),
        last4 = COALESCE($5, last4),
        color = COALESCE($6, color),
        linked_google = COALESCE($7, linked_google),
        cut_day = COALESCE($8, cut_day),
        pay_day = COALESCE($9, pay_day)
      WHERE id = $10 AND user_id = $11
      RETURNING *;
    `;
    const values = [
      body.alias !== undefined,
      alias,
      banco ?? null,
      body.type ?? null,
      last4 ?? null,
      body.color ?? null,
      linkedGoogle !== undefined ? linkedGoogle : null,
      cutDay ?? null,
      payDay ?? null,
      id,
      userId,
    ];

    const result = await query(updateQuery, values);
    if (result.rows.length === 0) {
      return c.json({ error: "Tarjeta no encontrada" }, 404);
    }

    return c.json({
      message: "Tarjeta actualizada correctamente",
      data: mapCardRow(result.rows[0]),
    });
  } catch (err: any) {
    return c.json({ error: "Error actualizando tarjeta", details: err.detail || err.message }, 500);
  }
};

cardRoutes.put("/:id", updateCardHandler);
cardRoutes.put("/", updateCardHandler);

// DELETE /card / DELETE /card/:id
const deleteCardHandler = async (c: any) => {
  const userId = c.get("userId");
  const paramId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const id = paramId || body.id || c.req.query("id");

  if (!id) {
    return c.json({ error: "Falta el id de la tarjeta" }, 400);
  }

  try {
    const { cardTable } = await getTables();
    const result = await query(
      `DELETE FROM ${cardTable} WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: "Tarjeta no encontrada" }, 404);
    }

    return c.json({
      message: "Tarjeta eliminada correctamente",
    });
  } catch (err: any) {
    return c.json({ error: "Error eliminando tarjeta", details: err.detail || err.message }, 500);
  }
};

cardRoutes.delete("/:id", deleteCardHandler);
cardRoutes.delete("/", deleteCardHandler);
