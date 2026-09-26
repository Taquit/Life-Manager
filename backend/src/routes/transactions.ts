import { Hono } from "hono";
import { query, getTables } from "../db";
import { authMiddleware } from "../middleware/auth";
import {
  TransactionDTO,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  MonthlySummaryDTO,
  CategoryBreakdownDTO,
  GooglePayTransactionDTO,
  AppEnv,
} from "../types";

export const transactionRoutes = new Hono<AppEnv>();

transactionRoutes.use("*", authMiddleware);

function mapTransactionRow(row: any): TransactionDTO {
  return {
    id: String(row.id),
    userId: row.user_id,
    categoryId: row.category_id ? String(row.category_id) : null,
    cardId: row.card_id ? String(row.card_id) : null,
    type: row.type || "gasto",
    amount: Number(row.amount),
    date: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
    note: row.note ?? null,
    origin: row.origin || "manual",
    categoryName: row.category_name ?? null,
    categoryColor: row.category_color ?? null,
    categoryIcon: row.category_icon ?? null,
    cardBanco: row.card_banco ?? null,
    cardLast4: row.card_last_4 ?? null,
  };
}

// GET /transactions/summary (Resumen mensual)
transactionRoutes.get("/summary", async (c) => {
  const userId = c.get("userId");
  const monthParam = c.req.query("month") || new Date().toISOString().substring(0, 7); // "YYYY-MM"

  try {
    const { transactionTable, categoryTable } = await getTables();

    const transactionsQuery = `
      SELECT
        t.*,
        c.name AS category_name,
        c.color AS category_color,
        c.icon AS category_icon
      FROM ${transactionTable} t
      LEFT JOIN ${categoryTable} c ON t.category_id = c.id
      WHERE t.user_id = $1
        AND to_char(t.date, 'YYYY-MM') = $2
      ORDER BY t.date DESC;
    `;
    const result = await query(transactionsQuery, [userId, monthParam]);
    const rows = result.rows;

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<
      string,
      { id: string; name: string; color: string; icon: string; amount: number }
    > = {};

    for (const r of rows) {
      const amt = Number(r.amount);
      const isIncome = r.type === "ingreso" || r.type === "income";

      if (isIncome) {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        const catId = r.category_id ? String(r.category_id) : "uncategorized";
        const catName = r.category_name || "Sin categoria";
        const catColor = r.category_color || "#8A7FBD";
        const catIcon = r.category_icon || "help-circle";

        if (!categoryTotals[catId]) {
          categoryTotals[catId] = {
            id: catId,
            name: catName,
            color: catColor,
            icon: catIcon,
            amount: 0,
          };
        }
        categoryTotals[catId].amount += amt;
      }
    }

    const categoryBreakdown: CategoryBreakdownDTO[] = Object.values(categoryTotals).map((item) => ({
      categoryId: item.id,
      categoryName: item.name,
      categoryColor: item.color,
      categoryIcon: item.icon,
      totalAmount: Number(item.amount.toFixed(2)),
      percentage: totalExpense > 0 ? Number(((item.amount / totalExpense) * 100).toFixed(2)) : 0,
    }));

    const summary: MonthlySummaryDTO = {
      month: monthParam,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      netBalance: Number((totalIncome - totalExpense).toFixed(2)),
      categoryBreakdown,
    };

    return c.json({
      message: "Resumen mensual obtenido correctamente",
      data: summary,
    });
  } catch (err: any) {
    return c.json({ error: "Error generando resumen mensual", details: err.message }, 500);
  }
});

// GET /transactions (Listado con filtros)
transactionRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const id = c.req.query("id");
  const type = c.req.query("type");
  const categoryId = c.req.query("categoryId");
  const cardId = c.req.query("cardId");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const limit = Math.min(Number(c.req.query("limit") || 50), 100);
  const offset = Number(c.req.query("offset") || 0);

  try {
    const { transactionTable, categoryTable, cardTable } = await getTables();

    if (id) {
      const singleQuery = `
        SELECT
          t.*,
          c.name AS category_name,
          c.color AS category_color,
          c.icon AS category_icon,
          cd.banco AS card_banco,
          cd.last_4 AS card_last_4
        FROM ${transactionTable} t
        LEFT JOIN ${categoryTable} c ON t.category_id = c.id
        LEFT JOIN ${cardTable} cd ON t.card_id = cd.id
        WHERE t.id = $1 AND t.user_id = $2;
      `;
      const res = await query(singleQuery, [id, userId]);
      if (res.rows.length === 0) {
        return c.json({ error: "Transaccion no encontrada" }, 404);
      }
      return c.json({
        message: "Transaccion obtenida correctamente",
        data: mapTransactionRow(res.rows[0]),
      });
    }

    let filterSql = `WHERE t.user_id = $1`;
    const params: any[] = [userId];
    let idx = 2;

    if (type) {
      filterSql += ` AND t.type = $${idx++}`;
      params.push(type);
    }
    if (categoryId) {
      filterSql += ` AND t.category_id = $${idx++}`;
      params.push(categoryId);
    }
    if (cardId) {
      filterSql += ` AND t.card_id = $${idx++}`;
      params.push(cardId);
    }
    if (startDate) {
      filterSql += ` AND t.date >= $${idx++}`;
      params.push(startDate);
    }
    if (endDate) {
      filterSql += ` AND t.date <= $${idx++}`;
      params.push(endDate);
    }

    params.push(limit);
    const limitIdx = idx++;
    params.push(offset);
    const offsetIdx = idx++;

    const listQuery = `
      SELECT
        t.*,
        c.name AS category_name,
        c.color AS category_color,
        c.icon AS category_icon,
        cd.banco AS card_banco,
        cd.last_4 AS card_last_4
      FROM ${transactionTable} t
      LEFT JOIN ${categoryTable} c ON t.category_id = c.id
      LEFT JOIN ${cardTable} cd ON t.card_id = cd.id
      ${filterSql}
      ORDER BY t.date DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    const res = await query(listQuery, params);
    const data = res.rows.map(mapTransactionRow);

    return c.json({
      message: "Transacciones obtenidas correctamente",
      data,
    });
  } catch (err: any) {
    return c.json({ error: "Error obteniendo transacciones", details: err.message }, 500);
  }
});

// GET /transactions/:id
transactionRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  try {
    const { transactionTable, categoryTable, cardTable } = await getTables();
    const singleQuery = `
      SELECT
        t.*,
        c.name AS category_name,
        c.color AS category_color,
        c.icon AS category_icon,
        cd.banco AS card_banco,
        cd.last_4 AS card_last_4
      FROM ${transactionTable} t
      LEFT JOIN ${categoryTable} c ON t.category_id = c.id
      LEFT JOIN ${cardTable} cd ON t.card_id = cd.id
      WHERE t.id = $1 AND t.user_id = $2;
    `;
    const res = await query(singleQuery, [id, userId]);
    if (res.rows.length === 0) {
      return c.json({ error: "Transaccion no encontrada" }, 404);
    }
    return c.json({
      message: "Transaccion obtenida correctamente",
      data: mapTransactionRow(res.rows[0]),
    });
  } catch (err: any) {
    return c.json({ error: "Error obteniendo transaccion", details: err.message }, 500);
  }
});

// POST /transactions/google-pay
transactionRoutes.post("/google-pay", async (c) => {
  const userId = c.get("userId");
  const body: GooglePayTransactionDTO = await c.req.json().catch(() => ({} as any));

  const amount = Number(body.amount);
  if (body.amount === undefined || body.amount === null || isNaN(amount) || amount <= 0) {
    return c.json(
      {
        error: "Monto invalido. Debe ser un numero mayor a 0",
      },
      400
    );
  }

  const cardLast4 = body.cardLast4 ? String(body.cardLast4).trim() : "";
  if (!cardLast4 || !/^\d{4}$/.test(cardLast4)) {
    return c.json(
      {
        error: "Los ultimos 4 digitos de la tarjeta son obligatorios y deben contener exactamente 4 digitos",
      },
      400
    );
  }

  try {
    const { cardTable, categoryTable, transactionTable } = await getTables();

    // 1. Buscar o crear tarjeta para el usuario con last_4 = cardLast4
    const cardQuery = `
      SELECT * FROM ${cardTable}
      WHERE user_id = $1 AND last_4 = $2
      ORDER BY id ASC
      LIMIT 1;
    `;
    const cardRes = await query(cardQuery, [userId, cardLast4]);

    let cardRow = cardRes.rows[0];
    if (!cardRow) {
      const insertCardSql = `
        INSERT INTO ${cardTable} (user_id, banco, alias, type, last_4, color, linked_google)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const cardValues = [
        userId,
        "Google Pay",
        `Tarjeta •••• ${cardLast4}`,
        "debito",
        cardLast4,
        "#7C3AED",
        true,
      ];
      const newCardRes = await query(insertCardSql, cardValues);
      cardRow = newCardRes.rows[0];
    }

    // 2. Buscar o crear categoria 'Google Pay' (usuario o global)
    const categoryQuery = `
      SELECT * FROM ${categoryTable}
      WHERE LOWER(name) = 'google pay'
        AND (user_id = $1 OR user_id IS NULL)
      ORDER BY (user_id IS NOT NULL) DESC, id ASC
      LIMIT 1;
    `;
    const catRes = await query(categoryQuery, [userId]);

    let categoryRow = catRes.rows[0];
    if (!categoryRow) {
      const insertCatSql = `
        INSERT INTO ${categoryTable} (user_id, name, type, color, icon)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const catValues = [
        userId,
        "Google Pay",
        "gasto",
        "#4285F4",
        "contactless",
      ];
      const newCatRes = await query(insertCatSql, catValues);
      categoryRow = newCatRes.rows[0];
    }

    // 3. Crear transaccion
    let txDate = new Date();
    if (body.date) {
      const parsedDate = new Date(body.date);
      if (!isNaN(parsedDate.getTime())) {
        txDate = parsedDate;
      }
    }

    const note = body.note || body.merchant || "Pago con Google Pay";
    const origin = "automático_google_pay";
    const type = "gasto";

    const insertTxSql = `
      INSERT INTO ${transactionTable} (user_id, category_id, card_id, type, amount, date, note, origin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const txValues = [
      userId,
      categoryRow.id,
      cardRow.id,
      type,
      amount,
      txDate,
      note,
      origin,
    ];
    const txRes = await query(insertTxSql, txValues);
    const savedTx = txRes.rows[0];

    const transactionData: TransactionDTO = {
      id: String(savedTx.id),
      userId: savedTx.user_id,
      categoryId: String(categoryRow.id),
      cardId: String(cardRow.id),
      type: savedTx.type || type,
      amount: Number(savedTx.amount),
      date: savedTx.date ? new Date(savedTx.date).toISOString() : txDate.toISOString(),
      note: savedTx.note ?? note,
      origin: savedTx.origin || origin,
      categoryName: categoryRow.name || "Google Pay",
      categoryColor: categoryRow.color || "#4285F4",
      categoryIcon: categoryRow.icon || "contactless",
      cardBanco: cardRow.banco || "Google Pay",
      cardLast4: cardRow.last_4 || cardLast4,
    };

    return c.json(
      {
        message: "Transaccion automatica registrada correctamente",
        data: transactionData,
      },
      201
    );
  } catch (err: any) {
    return c.json(
      {
        error: "Error procesando transaccion automatica de Google Pay",
        details: err.message,
      },
      500
    );
  }
});

// POST /transactions
transactionRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body: CreateTransactionDTO = await c.req.json().catch(() => ({} as any));

  const amount = body.amount;
  const categoryId = body.categoryId ?? body.category_id ?? null;
  const cardId = body.cardId ?? body.card_id ?? null;
  const note = body.note ?? body.title ?? null;
  const type = body.type ?? "gasto";
  const origin = body.origin ?? (body.isAuto ? "automático_google_pay" : "manual");
  const date = body.date ? new Date(body.date) : new Date();

  if (amount === undefined || isNaN(Number(amount))) {
    return c.json({ error: "Faltan datos obligatorios: amount valido" }, 400);
  }

  try {
    const { transactionTable } = await getTables();

    const insertQuery = `
      INSERT INTO ${transactionTable} (user_id, category_id, card_id, type, amount, date, note, origin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [userId, categoryId, cardId, type, amount, date, note, origin];
    const result = await query(insertQuery, values);
    const saved = result.rows[0];

    return c.json(
      {
        message: "Transaccion guardada exitosamente",
        data: mapTransactionRow(saved),
      },
      201
    );
  } catch (err: any) {
    return c.json({ error: "Error creando transaccion", details: err.message }, 500);
  }
});

// PUT /transactions / PUT /transactions/:id
const updateHandler = async (c: any) => {
  const userId = c.get("userId");
  const paramId = c.req.param("id");
  const body: UpdateTransactionDTO & { id?: string | number } = await c.req.json().catch(() => ({} as any));
  const id = paramId || body.id;

  if (!id) {
    return c.json({ error: "Falta el id de la transaccion" }, 400);
  }

  const categoryId = body.categoryId !== undefined ? body.categoryId : body.category_id;
  const cardId = body.cardId !== undefined ? body.cardId : body.card_id;
  const note = body.note !== undefined ? body.note : body.title;
  const origin = body.origin ?? (body.isAuto !== undefined ? (body.isAuto ? "automático_google_pay" : "manual") : undefined);

  try {
    const { transactionTable } = await getTables();
    const updateQuery = `
      UPDATE ${transactionTable}
      SET
        amount = COALESCE($1, amount),
        type = COALESCE($2, type),
        category_id = CASE WHEN $3::boolean THEN $4 ELSE category_id END,
        card_id = CASE WHEN $5::boolean THEN $6 ELSE card_id END,
        note = CASE WHEN $7::boolean THEN $8 ELSE note END,
        origin = COALESCE($9, origin),
        date = COALESCE($10, date)
      WHERE id = $11 AND user_id = $12
      RETURNING *;
    `;
    const values = [
      body.amount ?? null,
      body.type ?? null,
      categoryId !== undefined,
      categoryId ?? null,
      cardId !== undefined,
      cardId ?? null,
      note !== undefined,
      note ?? null,
      origin ?? null,
      body.date ? new Date(body.date) : null,
      id,
      userId,
    ];

    const result = await query(updateQuery, values);
    if (result.rows.length === 0) {
      return c.json({ error: "Transaccion no encontrada" }, 404);
    }

    return c.json({
      message: "Transaccion actualizada exitosamente",
      data: mapTransactionRow(result.rows[0]),
    });
  } catch (err: any) {
    return c.json({ error: "Error actualizando transaccion", details: err.message }, 500);
  }
};

transactionRoutes.put("/:id", updateHandler);
transactionRoutes.put("/", updateHandler);

// DELETE /transactions / DELETE /transactions/:id
const deleteHandler = async (c: any) => {
  const userId = c.get("userId");
  const paramId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const id = paramId || body.id || c.req.query("id");

  if (!id) {
    return c.json({ error: "Falta el id de la transaccion" }, 400);
  }

  try {
    const { transactionTable } = await getTables();
    const result = await query(
      `DELETE FROM ${transactionTable} WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: "Transaccion no encontrada" }, 404);
    }

    return c.json({
      message: "Transaccion eliminada correctamente",
    });
  } catch (err: any) {
    return c.json({ error: "Error eliminando transaccion", details: err.message }, 500);
  }
};

transactionRoutes.delete("/:id", deleteHandler);
transactionRoutes.delete("/", deleteHandler);
