import { Client, QueryResult, QueryResultRow } from "pg";
import { Resource } from "sst";

export function getConnectionString(): string {
  return (
    (Resource as any).DATABASE_URL?.value ||
    process.env.DATABASE_URL ||
    ""
  );
}

export function createClient(): Client {
  return new Client({
    connectionString: getConnectionString(),
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 5000,
  });
}

/**
 * Executes a callback with a dedicated PostgreSQL Client,
 * ensuring the connection is cleanly closed in a finally block.
 */
export async function withClient<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const client = createClient();
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end().catch((err) => {
      console.error("Error cerrando conexion de PostgreSQL Client:", err);
    });
  }
}

/**
 * Executes a query using a dedicated PostgreSQL Client,
 * immediately closing the session upon query completion.
 */
export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> {
  return withClient((client) => client.query<R>(text, params));
}

let resolvedTables: Record<string, string> | null = null;
let resolveTablesPromise: Promise<Record<string, string>> | null = null;
let userTableEnsured = false;
let schemaConstraintsEnsured = false;
let schemaConstraintsPromise: Promise<void> | null = null;

export async function ensureUserTable(): Promise<void> {
  if (userTableEnsured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS public.users (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password text NOT NULL,
      CONSTRAINT users_pkey PRIMARY KEY (id)
    );
  `);
  userTableEnsured = true;
}

/**
 * Ensures schema constraints and columns are aligned:
 * 1. Ensures the 'alias' column exists on the Card table.
 * 2. Ensures foreign key constraints on 'user_id' in Category, Card, Service,
 *    and Transaction reference public.users(id) instead of auth.users(id).
 */
export async function ensureSchemaConstraints(tables: Record<string, string>): Promise<void> {
  if (schemaConstraintsEnsured) return;
  if (!schemaConstraintsPromise) {
    schemaConstraintsPromise = (async () => {
      // 1. Asegurar columna alias en Card
      const cardTable = tables.Card || 'public."Card"';
      try {
        await query(`ALTER TABLE ${cardTable} ADD COLUMN IF NOT EXISTS alias text;`);
      } catch (err: any) {
        console.warn(`Advertencia al asegurar columna alias en ${cardTable}:`, err.message);
      }

      // 2. Ajustar restricciones de clave foranea user_id para Category, Card, Service, Transaction
      const targetTables = [
        { key: "Category", constraintName: "Category_user_id_fkey" },
        { key: "Card", constraintName: "Card_user_id_fkey" },
        { key: "Service", constraintName: "Service_user_id_fkey" },
        { key: "Transaction", constraintName: "Transaction_user_id_fkey" },
      ];

      for (const target of targetTables) {
        const tableName = tables[target.key];
        if (!tableName) continue;

        try {
          // Extraer nombre simple de tabla para consultar pg_class
          const rawTableName = tableName.replace(/^public\./, "").replace(/^"|"$/g, "");

          // Buscar cualquier FK en la columna user_id para esta tabla
          const fkCheckQuery = `
            SELECT
              con.conname AS constraint_name,
              fnsp.nspname AS foreign_schema,
              frel.relname AS foreign_table
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            JOIN pg_class frel ON frel.oid = con.confrelid
            JOIN pg_namespace fnsp ON fnsp.oid = frel.relnamespace
            JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = con.conkey[1]
            WHERE nsp.nspname = 'public'
              AND con.contype = 'f'
              AND att.attname = 'user_id'
              AND LOWER(rel.relname) = LOWER($1);
          `;

          const fkResult = await query(fkCheckQuery, [rawTableName]);

          let needsRecreation = false;
          let constraintToDrop: string | null = null;

          if (fkResult.rows.length > 0) {
            const existingFk = fkResult.rows[0];
            if (existingFk.foreign_schema !== "public" || existingFk.foreign_table !== "users") {
              needsRecreation = true;
              constraintToDrop = existingFk.constraint_name;
            }
          } else {
            // No existe FK en user_id, se crea
            needsRecreation = true;
          }

          if (needsRecreation) {
            if (constraintToDrop) {
              await query(`ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS "${constraintToDrop}";`);
            }
            // Tambien dropear por el nombre estandar por precaucion
            await query(`ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS "${target.constraintName}";`);

            // Limpiar registros huerfanos previos si existieran antes de aplicar la restriccion
            await query(`
              DELETE FROM ${tableName}
              WHERE user_id IS NOT NULL
                AND user_id NOT IN (SELECT id FROM public.users);
            `).catch(() => {});

            // Crear la restriccion apuntando a public.users(id)
            await query(`
              ALTER TABLE ${tableName}
              ADD CONSTRAINT "${target.constraintName}"
              FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
            `);
          }
        } catch (err: any) {
          console.warn(`Advertencia al alinear clave foranea para ${target.key}:`, err.message);
        }
      }

      schemaConstraintsEnsured = true;
    })().finally(() => {
      schemaConstraintsPromise = null;
    });
  }
  return schemaConstraintsPromise;
}

async function resolveAllTables(): Promise<Record<string, string>> {
  if (resolvedTables) {
    if (!schemaConstraintsEnsured) {
      await ensureSchemaConstraints(resolvedTables);
    }
    return resolvedTables;
  }
  if (!resolveTablesPromise) {
    resolveTablesPromise = (async () => {
      await ensureUserTable();
      const res = await query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
      );
      const existing = res.rows.map((r) => r.table_name);

      const findMatch = (candidates: string[], defaultFallback: string): string => {
        for (const cand of candidates) {
          const found = existing.find((t) => t.toLowerCase() === cand.toLowerCase());
          if (found) {
            return /^[a-z_][a-z0-9_]*$/.test(found) ? `public.${found}` : `public."${found}"`;
          }
        }
        return defaultFallback;
      };

      const resolved = {
        Category: findMatch(["Category", "category", "categories"], 'public."Category"'),
        Card: findMatch(["Card", "card", "cards"], 'public."Card"'),
        Service: findMatch(["Service", "service", "services", "servicio_a_pagar"], 'public."Service"'),
        Transaction: findMatch(["Transaction", "transaction", "transactions"], 'public."Transaction"'),
        User: findMatch(["users", "User", "user", "usuario"], "public.users"),
      };
      resolvedTables = resolved;

      await ensureSchemaConstraints(resolved);

      return resolved;
    })().finally(() => {
      resolveTablesPromise = null;
    });
  }
  return resolveTablesPromise;
}

export async function getTableName(
  alias: "Category" | "Card" | "Service" | "Transaction" | "User"
): Promise<string> {
  if (resolvedTables && resolvedTables[alias]) {
    return resolvedTables[alias];
  }

  try {
    const tables = await resolveAllTables();
    return tables[alias];
  } catch (err) {
    return alias === "User" ? "public.users" : `public."${alias}"`;
  }
}

export async function getTables() {
  const tables = await resolveAllTables();
  return {
    categoryTable: tables.Category,
    cardTable: tables.Card,
    serviceTable: tables.Service,
    transactionTable: tables.Transaction,
    userTable: tables.User,
  };
}

/**
 * Backwards compatibility shim for any consumer expecting getPool().
 */
export function getPool() {
  return {
    query,
    end: async () => {},
  };
}
