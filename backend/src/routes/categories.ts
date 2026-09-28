import { Hono } from "hono";
import { query, getTables } from "../db";
import { authMiddleware } from "../middleware/auth";
import { CategoryDTO, CreateCategoryDTO, UpdateCategoryDTO, AppEnv } from "../types";

export const categoryRoutes = new Hono<AppEnv>();

categoryRoutes.use("*", authMiddleware);

function mapCategoryRow(row: any): CategoryDTO {
  return {
    id: String(row.id),
    userId: row.user_id,
    name: row.name,
    type: row.type || "gasto",
    color: row.color || "#B84FFF",
    icon: row.icon || "tag",
    budget: row.budget !== null && row.budget !== undefined ? Number(row.budget) : null,
    count: row.tx_count !== undefined ? Number(row.tx_count) : 0,
  };
}

// GET /category
categoryRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const type = c.req.query("type");

  try {
    const { categoryTable, transactionTable } = await getTables();
    let sql = `
      SELECT c.*, COUNT(t.id) AS tx_count
      FROM ${categoryTable} c
      LEFT JOIN ${transactionTable} t ON t.category_id = c.id AND t.user_id = $1
      WHERE (c.user_id = $1 OR c.user_id IS NULL)
    `;
    const params: any[] = [userId];

    if (type) {
      sql += ` AND c.type = $2`;
      params.push(type);
    }
    sql += ` GROUP BY c.id ORDER BY c.name ASC;`;

    const result = await query(sql, params);
    const data = result.rows.map(mapCategoryRow);

    return c.json({
      message: "Categorias obtenidas correctamente",
      data,
    });
  } catch (err: any) {
    return c.json({ error: "Error obteniendo categorias", details: err.detail || err.message }, 500);
  }
});

// POST /category
categoryRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body: CreateCategoryDTO = await c.req.json().catch(() => ({} as any));
  const { name, color, icon, type, budget } = body;

  if (!name || !color) {
    return c.json({ error: "Faltan datos obligatorios: name y color" }, 400);
  }

  try {
    const { categoryTable } = await getTables();
    const insertQuery = `
      INSERT INTO ${categoryTable} (user_id, name, type, color, icon, budget)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      userId,
      name,
      type || "gasto",
      color,
      icon || "tag",
      budget !== undefined && budget !== null ? Number(budget) : null,
    ];
    const result = await query(insertQuery, values);
    const saved = result.rows[0];

    return c.json(
      {
        message: "Categoria creada correctamente",
        data: mapCategoryRow(saved),
      },
      201
    );
  } catch (err: any) {
    return c.json({ error: "Error creando categoria", details: err.detail || err.message }, 500);
  }
});

// PUT /category / PUT /category/:id
const updateCategoryHandler = async (c: any) => {
  const userId = c.get("userId");
  const paramId = c.req.param("id");
  const body: UpdateCategoryDTO & { id?: string | number } = await c.req.json().catch(() => ({} as any));
  const id = paramId || body.id;

  if (!id) {
    return c.json({ error: "Falta el id de la categoria" }, 400);
  }

  try {
    const { categoryTable } = await getTables();
    const updateQuery = `
      UPDATE ${categoryTable}
      SET
        name = COALESCE($1, name),
        color = COALESCE($2, color),
        icon = COALESCE($3, icon),
        type = COALESCE($4, type),
        budget = CASE WHEN $5::boolean THEN $6 ELSE budget END
      WHERE id = $7 AND user_id = $8
      RETURNING *;
    `;
    const values = [
      body.name ?? null,
      body.color ?? null,
      body.icon ?? null,
      body.type ?? null,
      body.budget !== undefined,
      body.budget !== undefined && body.budget !== null ? Number(body.budget) : null,
      id,
      userId,
    ];

    const result = await query(updateQuery, values);
    if (result.rows.length === 0) {
      return c.json({ error: "Categoria no encontrada" }, 404);
    }

    return c.json({
      message: "Categoria actualizada correctamente",
      data: mapCategoryRow(result.rows[0]),
    });
  } catch (err: any) {
    return c.json({ error: "Error actualizando categoria", details: err.detail || err.message }, 500);
  }
};

categoryRoutes.put("/:id", updateCategoryHandler);
categoryRoutes.put("/", updateCategoryHandler);

// DELETE /category / DELETE /category/:id
const deleteCategoryHandler = async (c: any) => {
  const userId = c.get("userId");
  const paramId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const id = paramId || body.id || c.req.query("id");

  if (!id) {
    return c.json({ error: "Falta el id de la categoria" }, 400);
  }

  try {
    const { categoryTable } = await getTables();
    const result = await query(
      `DELETE FROM ${categoryTable} WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: "Categoria no encontrada" }, 404);
    }

    return c.json({
      message: "Categoria eliminada correctamente",
    });
  } catch (err: any) {
    return c.json({ error: "Error eliminando categoria", details: err.detail || err.message }, 500);
  }
};

categoryRoutes.delete("/:id", deleteCategoryHandler);
categoryRoutes.delete("/", deleteCategoryHandler);
