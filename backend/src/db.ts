import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { Resource } from "sst";

export function getConnectionString(): string {
  return (
    (Resource as any).DATABASE_URL?.value ||
    process.env.DATABASE_URL ||
    ""
  );
}

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getConnectionString(),
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });

    pool.on("error", (err) => {
      console.error("Error inesperado en cliente inactivo del pg.Pool:", err);
    });
  }
  return pool;
}

export async function withClient<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[],
  retries = 2
): Promise<QueryResult<R>> {
  const p = getPool();
  try {
    return await p.query<R>(text, params);
  } catch (err: any) {
    const isTransient =
      err?.code === "ECONNRESET" ||
      err?.code === "57P01" ||
      err?.code === "57P02" ||
      err?.code === "57P03" ||
      err?.code === "08006" ||
      err?.code === "08001" ||
      err?.code === "08004" ||
      err?.message?.includes("Connection terminated") ||
      err?.message?.includes("timeout");

    if (retries > 0 && isTransient) {
      console.warn(`Error transitorio de conexion en query (${err.message}), reintentando...`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return query<R>(text, params, retries - 1);
    }
    throw err;
  }
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

export async function ensureSchemaConstraints(tables: Record<string, string>): Promise<void> {
  if (schemaConstraintsEnsured) return;
  if (!schemaConstraintsPromise) {
    schemaConstraintsPromise = (async () => {
      try {
        const colRes = await query<{
          table_name: string;
          column_name: string;
          data_type: string;
        }>(`
          SELECT table_name, column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public';
        `);

        const existingCols = new Map<string, Map<string, string>>();
        for (const row of colRes.rows) {
          const t = row.table_name.toLowerCase();
          if (!existingCols.has(t)) {
            existingCols.set(t, new Map());
          }
          existingCols.get(t)!.set(row.column_name.toLowerCase(), row.data_type.toLowerCase());
        }

        const getTableRawName = (quotedName: string) =>
          quotedName.replace(/^public\./, "").replace(/^"|"$/g, "").toLowerCase();

        const cardRaw = getTableRawName(tables.Card || "Card");
        const catRaw = getTableRawName(tables.Category || "Category");
        const txRaw = getTableRawName(tables.Transaction || "Transaction");
        const srvRaw = getTableRawName(tables.Service || "Service");

        const catIdType = existingCols.get(catRaw)?.get("id") || "bigint";
        const cardIdType = existingCols.get(cardRaw)?.get("id") || "bigint";

        const catFkType = catIdType.includes("uuid") ? "uuid" : "bigint";
        const cardFkType = cardIdType.includes("uuid") ? "uuid" : "bigint";

        const ddlStatements: string[] = [];

        if (tables.Card) {
          ddlStatements.push(
            `ALTER TABLE ${tables.Card} ADD COLUMN IF NOT EXISTS alias text;`,
            `ALTER TABLE ${tables.Card} ADD COLUMN IF NOT EXISTS banco text;`,
            `ALTER TABLE ${tables.Card} ADD COLUMN IF NOT EXISTS bankname text;`,
            `ALTER TABLE ${tables.Card} ADD COLUMN IF NOT EXISTS type text DEFAULT 'debito';`,
            `ALTER TABLE ${tables.Card} ADD COLUMN IF NOT EXISTS last_4 text;`,
            `ALTER TABLE ${tables.Card} ADD COLUMN IF NOT EXISTS last4 text;`,
            `ALTER TABLE ${tables.Card} ADD COLUMN IF NOT EXISTS color text DEFAULT '#7C3AED';`,
            `ALTER TABLE ${tables.Card} ADD COLUMN IF NOT EXISTS linked_google boolean DEFAULT false;`,
            `ALTER TABLE ${tables.Card} ADD COLUMN IF NOT EXISTS cut_day integer;`,
            `ALTER TABLE ${tables.Card} ADD COLUMN IF NOT EXISTS pay_day integer;`
          );
        }

        if (tables.Category) {
          ddlStatements.push(
            `ALTER TABLE ${tables.Category} ADD COLUMN IF NOT EXISTS type text DEFAULT 'gasto';`,
            `ALTER TABLE ${tables.Category} ADD COLUMN IF NOT EXISTS color text DEFAULT '#B84FFF';`,
            `ALTER TABLE ${tables.Category} ADD COLUMN IF NOT EXISTS icon text DEFAULT 'tag';`,
            `ALTER TABLE ${tables.Category} ADD COLUMN IF NOT EXISTS budget numeric;`
          );
        }

        if (tables.Transaction) {
          const txCols = existingCols.get(txRaw);
          if (!txCols?.has("category_id")) {
            ddlStatements.push(`ALTER TABLE ${tables.Transaction} ADD COLUMN IF NOT EXISTS category_id ${catFkType};`);
          }
          if (!txCols?.has("card_id")) {
            ddlStatements.push(`ALTER TABLE ${tables.Transaction} ADD COLUMN IF NOT EXISTS card_id ${cardFkType};`);
          }
          ddlStatements.push(
            `ALTER TABLE ${tables.Transaction} ADD COLUMN IF NOT EXISTS type text DEFAULT 'gasto';`,
            `ALTER TABLE ${tables.Transaction} ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 0;`,
            `ALTER TABLE ${tables.Transaction} ADD COLUMN IF NOT EXISTS date timestamp with time zone DEFAULT now();`,
            `ALTER TABLE ${tables.Transaction} ADD COLUMN IF NOT EXISTS note text;`,
            `ALTER TABLE ${tables.Transaction} ADD COLUMN IF NOT EXISTS title text;`,
            `ALTER TABLE ${tables.Transaction} ADD COLUMN IF NOT EXISTS origin text DEFAULT 'manual';`,
            `ALTER TABLE ${tables.Transaction} ADD COLUMN IF NOT EXISTS is_auto boolean DEFAULT false;`
          );
        }

        if (tables.Service) {
          const srvCols = existingCols.get(srvRaw);
          if (!srvCols?.has("category_id")) {
            ddlStatements.push(`ALTER TABLE ${tables.Service} ADD COLUMN IF NOT EXISTS category_id ${catFkType};`);
          }
          ddlStatements.push(
            `ALTER TABLE ${tables.Service} ADD COLUMN IF NOT EXISTS name text;`,
            `ALTER TABLE ${tables.Service} ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 0;`,
            `ALTER TABLE ${tables.Service} ADD COLUMN IF NOT EXISTS due_date date;`,
            `ALTER TABLE ${tables.Service} ADD COLUMN IF NOT EXISTS state text DEFAULT 'pendiente';`,
            `ALTER TABLE ${tables.Service} ADD COLUMN IF NOT EXISTS pay_day integer;`
          );
        }

        for (const sql of ddlStatements) {
          try {
            await query(sql);
          } catch (err: any) {
            console.warn(`Advertencia al ejecutar schema DDL: ${sql} - ${err.message}`);
          }
        }

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
            const rawTableName = tableName.replace(/^public\./, "").replace(/^"|"$/g, "");

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
              needsRecreation = true;
            }

            if (needsRecreation) {
              if (constraintToDrop) {
                await query(`ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS "${constraintToDrop}";`);
              }
              await query(`ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS "${target.constraintName}";`);

              await query(`
                DELETE FROM ${tableName}
                WHERE user_id IS NOT NULL
                  AND user_id NOT IN (SELECT id FROM public.users);
              `).catch(() => {});

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
      } catch (err: any) {
        console.error("Error al asegurar restricciones de esquema:", err.message);
      }
    })().finally(() => {
      schemaConstraintsPromise = null;
    });
  }
  return schemaConstraintsPromise;
}

async function resolveAllTables(): Promise<Record<string, string>> {
  if (resolvedTables && schemaConstraintsEnsured) {
    return resolvedTables;
  }
  if (!resolveTablesPromise) {
    resolveTablesPromise = (async () => {
      await ensureUserTable();

      if (!resolvedTables) {
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

        resolvedTables = {
          Category: findMatch(["Category", "category", "categories"], 'public."Category"'),
          Card: findMatch(["Card", "card", "cards"], 'public."Card"'),
          Service: findMatch(["Service", "service", "services", "servicio_a_pagar"], 'public."Service"'),
          Transaction: findMatch(["Transaction", "transaction", "transactions"], 'public."Transaction"'),
          User: findMatch(["users", "User", "user", "usuario"], "public.users"),
        };
      }

      if (!schemaConstraintsEnsured) {
        await ensureSchemaConstraints(resolvedTables);
      }

      return resolvedTables;
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
