import { Hono } from "hono";
import { query, getTables } from "../db";
import { authMiddleware } from "../middleware/auth";
import { ServiceDTO, CreateServiceDTO, UpdateServiceDTO, AppEnv } from "../types";

export const serviceRoutes = new Hono<AppEnv>();

serviceRoutes.use("*", authMiddleware);

function mapServiceRow(row: any): ServiceDTO {
  return {
    id: String(row.id),
    userId: row.user_id,
    categoryId: row.category_id ? String(row.category_id) : null,
    name: row.name,
    amount: Number(row.amount),
    dueDate: row.due_date ? new Date(row.due_date).toISOString().substring(0, 10) : null,
    state: row.state || "pendiente",
    payDay: row.pay_day !== null && row.pay_day !== undefined ? Number(row.pay_day) : null,
    categoryName: row.category_name ?? null,
  };
}

async function fetchServiceWithCategory(
  serviceTable: string,
  categoryTable: string,
  serviceId: string | number,
  userId: string
): Promise<ServiceDTO | null> {
  const sql = `
    SELECT
      s.*,
      c.name AS category_name
    FROM ${serviceTable} s
    LEFT JOIN ${categoryTable} c ON s.category_id = c.id
    WHERE s.id = $1 AND s.user_id = $2;
  `;
  const res = await query(sql, [serviceId, userId]);
  if (res.rows.length === 0) return null;
  return mapServiceRow(res.rows[0]);
}

// GET /services (Listado de servicios a pagar con filtro opcional de estado)
serviceRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const state = c.req.query("state");

  try {
    const { serviceTable, categoryTable } = await getTables();
    let sql = `
      SELECT
        s.*,
        c.name AS category_name
      FROM ${serviceTable} s
      LEFT JOIN ${categoryTable} c ON s.category_id = c.id
      WHERE s.user_id = $1
    `;
    const params: any[] = [userId];

    if (state && state.toLowerCase() !== "todos" && state.toLowerCase() !== "all") {
      sql += ` AND LOWER(s.state) = LOWER($2)`;
      params.push(state.toLowerCase());
    }
    sql += ` ORDER BY s.due_date ASC NULLS LAST, s.id ASC;`;

    const result = await query(sql, params);
    const data = result.rows.map(mapServiceRow);

    return c.json({
      message: "Servicios obtenidos correctamente",
      data,
    });
  } catch (err: any) {
    return c.json({ error: "Error obteniendo servicios", details: err.message }, 500);
  }
});

// GET /services/:id (Detalle de un servicio)
serviceRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  try {
    const { serviceTable, categoryTable } = await getTables();
    const service = await fetchServiceWithCategory(serviceTable, categoryTable, id, userId);

    if (!service) {
      return c.json({ error: "Servicio no encontrado" }, 404);
    }

    return c.json({
      message: "Servicio obtenido correctamente",
      data: service,
    });
  } catch (err: any) {
    return c.json({ error: "Error obteniendo servicio", details: err.message }, 500);
  }
});

// POST /services (Crear servicio)
serviceRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body: CreateServiceDTO = await c.req.json().catch(() => ({} as any));

  const name = body.name;
  const amount = body.amount;
  const categoryId = body.categoryId ?? body.category_id ?? null;
  const dueDate = body.dueDate ?? body.due_date ?? null;
  const state = body.state || "pendiente";
  const payDay = body.payDay ?? body.pay_day ?? null;

  if (!name || amount === undefined || isNaN(Number(amount))) {
    return c.json({ error: "Faltan datos obligatorios: name y amount valido" }, 400);
  }

  try {
    const { serviceTable, categoryTable } = await getTables();
    const insertQuery = `
      INSERT INTO ${serviceTable} (user_id, category_id, name, amount, due_date, state, pay_day)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;
    const values = [userId, categoryId, name, amount, dueDate, state, payDay];
    const result = await query(insertQuery, values);
    const savedId = result.rows[0].id;

    const fullService = await fetchServiceWithCategory(serviceTable, categoryTable, savedId, userId);

    return c.json(
      {
        message: "Servicio creado exitosamente",
        data: fullService,
      },
      201
    );
  } catch (err: any) {
    return c.json({ error: "Error creando servicio", details: err.message }, 500);
  }
});

// PUT /services/:id/pay (Marcar o alternar como pagado / pendiente)
serviceRoutes.put("/:id/pay", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));

  try {
    const { serviceTable, categoryTable } = await getTables();

    let updateQuery: string;
    let params: any[];

    if (body.state) {
      updateQuery = `
        UPDATE ${serviceTable}
        SET state = $1
        WHERE id = $2 AND user_id = $3
        RETURNING id;
      `;
      params = [body.state, id, userId];
    } else {
      updateQuery = `
        UPDATE ${serviceTable}
        SET state = CASE WHEN LOWER(state) = 'pagado' THEN 'pendiente' ELSE 'pagado' END
        WHERE id = $1 AND user_id = $2
        RETURNING id;
      `;
      params = [id, userId];
    }

    const result = await query(updateQuery, params);
    if (result.rows.length === 0) {
      return c.json({ error: "Servicio no encontrado" }, 404);
    }

    const fullService = await fetchServiceWithCategory(serviceTable, categoryTable, id, userId);

    return c.json({
      message: "Estado de servicio actualizado correctamente",
      data: fullService,
    });
  } catch (err: any) {
    return c.json({ error: "Error actualizando servicio", details: err.message }, 500);
  }
});

// PUT /services/:id o PUT /services (Actualizar servicio)
const updateServiceHandler = async (c: any) => {
  const userId = c.get("userId");
  const paramId = c.req.param("id");
  const body: UpdateServiceDTO & { id?: string | number } = await c.req.json().catch(() => ({} as any));
  const id = paramId || body.id;

  if (!id) {
    return c.json({ error: "Falta el id del servicio" }, 400);
  }

  const categoryId = body.categoryId !== undefined ? body.categoryId : body.category_id;
  const dueDate = body.dueDate !== undefined ? body.dueDate : body.due_date;
  const payDay = body.payDay !== undefined ? body.payDay : body.pay_day;

  try {
    const { serviceTable, categoryTable } = await getTables();
    const updateQuery = `
      UPDATE ${serviceTable}
      SET
        name = COALESCE($1, name),
        amount = COALESCE($2, amount),
        category_id = CASE WHEN $3::boolean THEN $4 ELSE category_id END,
        due_date = CASE WHEN $5::boolean THEN $6 ELSE due_date END,
        state = COALESCE($7, state),
        pay_day = CASE WHEN $8::boolean THEN $9 ELSE pay_day END
      WHERE id = $10 AND user_id = $11
      RETURNING id;
    `;
    const values = [
      body.name ?? null,
      body.amount ?? null,
      categoryId !== undefined,
      categoryId ?? null,
      dueDate !== undefined,
      dueDate ?? null,
      body.state ?? null,
      payDay !== undefined,
      payDay ?? null,
      id,
      userId,
    ];

    const result = await query(updateQuery, values);
    if (result.rows.length === 0) {
      return c.json({ error: "Servicio no encontrado" }, 404);
    }

    const fullService = await fetchServiceWithCategory(serviceTable, categoryTable, id, userId);

    return c.json({
      message: "Servicio actualizado correctamente",
      data: fullService,
    });
  } catch (err: any) {
    return c.json({ error: "Error actualizando servicio", details: err.message }, 500);
  }
};

serviceRoutes.put("/:id", updateServiceHandler);
serviceRoutes.put("/", updateServiceHandler);

// DELETE /services/:id o DELETE /services (Eliminar servicio)
const deleteServiceHandler = async (c: any) => {
  const userId = c.get("userId");
  const paramId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const id = paramId || body.id || c.req.query("id");

  if (!id) {
    return c.json({ error: "Falta el id del servicio" }, 400);
  }

  try {
    const { serviceTable } = await getTables();
    const result = await query(
      `DELETE FROM ${serviceTable} WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: "Servicio no encontrado" }, 404);
    }

    return c.json({
      message: "Servicio eliminado correctamente",
      id: String(result.rows[0].id),
    });
  } catch (err: any) {
    return c.json({ error: "Error eliminando servicio", details: err.message }, 500);
  }
};

serviceRoutes.delete("/:id", deleteServiceHandler);
serviceRoutes.delete("/", deleteServiceHandler);
