import { Hono } from "hono";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { Resource } from "sst";
import { query, getTables, ensureUserTable } from "../db";
import { authMiddleware } from "../middleware/auth";
import { UserDTO, RegisterUserDTO, LoginDTO, UpdateUserDTO, AppEnv } from "../types";

export const userRoutes = new Hono<AppEnv>();

// POST /user/login
userRoutes.post("/login", async (c) => {
  const body: LoginDTO = await c.req.json().catch(() => ({} as any));
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  try {
    await ensureUserTable();
    const { userTable } = await getTables();
    const result = await query(`SELECT * FROM ${userTable} WHERE email = $1`, [email]);

    if (result.rows.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return c.json({ error: "Invalid password" }, 401);
    }

    const secret =
      (Resource as any).JWT_SECRET?.value ||
      process.env.JWT_SECRET ||
      "";

    const token = jwt.sign(
      { user_id: user.id },
      secret,
      { expiresIn: "7d" }
    );

    const userDto: UserDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    return c.json({
      message: "Login successful",
      token,
      user: userDto,
    });
  } catch (err: any) {
    return c.json({ error: "Internal server error", details: err.message }, 500);
  }
});

// POST /user (Registro)
userRoutes.post("/", async (c) => {
  const body: RegisterUserDTO = await c.req.json().catch(() => ({} as any));
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return c.json({ error: "Faltan datos obligatorios: name, email o password" }, 400);
  }

  try {
    await ensureUserTable();
    const { userTable } = await getTables();
    const existing = await query(`SELECT id FROM ${userTable} WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return c.json({ error: "El correo ya esta registrado" }, 400);
    }

    const id = randomUUID();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertQuery = `
      INSERT INTO ${userTable} (id, name, email, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email;
    `;
    const result = await query(insertQuery, [id, name, email, hashedPassword]);
    const savedUser = result.rows[0];

    const userDto: UserDTO = {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
    };

    return c.json(
      {
        message: "Usuario creado correctamente",
        data: userDto,
      },
      201
    );
  } catch (err: any) {
    console.error("Error creando usuario:", err);
    return c.json({ error: "Error creando usuario", details: err.message }, 500);
  }
});

// GET /user, GET /user/me, GET /user/profile (Perfil)
const getUserProfileHandler = async (c: any) => {
  const userId = c.get("userId");

  try {
    const { userTable } = await getTables();
    const result = await query(
      `SELECT id, name, email FROM ${userTable} WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: "Usuario no encontrado" }, 404);
    }

    const row = result.rows[0];
    const userDto: UserDTO = {
      id: row.id,
      name: row.name,
      email: row.email,
    };

    return c.json({
      message: "Perfil de usuario obtenido",
      data: userDto,
    });
  } catch (err: any) {
    return c.json({ error: "Error obteniendo perfil", details: err.message }, 500);
  }
};

userRoutes.get("/", authMiddleware, getUserProfileHandler);
userRoutes.get("/me", authMiddleware, getUserProfileHandler);
userRoutes.get("/profile", authMiddleware, getUserProfileHandler);


// PUT /user (Actualizacion)
userRoutes.put("/", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body: UpdateUserDTO = await c.req.json().catch(() => ({} as any));
  const { name, email, password } = body;

  try {
    const { userTable } = await getTables();

    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const updateQuery = `
      UPDATE ${userTable}
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        password = COALESCE($3, password)
      WHERE id = $4
      RETURNING id, name, email;
    `;
    const values = [name ?? null, email ?? null, hashedPassword, userId];
    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return c.json({ error: "Usuario no encontrado" }, 404);
    }

    const row = result.rows[0];
    const userDto: UserDTO = {
      id: row.id,
      name: row.name,
      email: row.email,
    };

    return c.json({
      message: "Usuario actualizado correctamente",
      data: userDto,
    });
  } catch (err: any) {
    return c.json({ error: "Error actualizando usuario", details: err.message }, 500);
  }
});

// DELETE /user (Eliminacion)
userRoutes.delete("/", authMiddleware, async (c) => {
  const userId = c.get("userId");

  try {
    const { userTable } = await getTables();
    await query(`DELETE FROM ${userTable} WHERE id = $1`, [userId]);

    return c.json({
      message: "Cuenta de usuario eliminada correctamente",
    });
  } catch (err: any) {
    return c.json({ error: "Error eliminando usuario", details: err.message }, 500);
  }
});
