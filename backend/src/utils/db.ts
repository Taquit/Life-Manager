import { Pool, QueryResult, QueryResultRow } from "pg";
import { Resource } from "sst";

// Declarar el Pool fuera del handler permite que las invocaciones en caliente (warm starts)
// de la misma instancia Lambda reutilicen la conexión existente, reduciendo drásticamente
// los tiempos de respuesta y previniendo la sobrecarga de conexiones en Supabase.
let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: Resource.DATABASE_URL.value,
      ssl: { rejectUnauthorized: false },
      max: 2, // 1 a 2 conexiones por contenedor Lambda es ideal para evitar agotar el pool de Supabase
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Timeout de conexión de 10 segundos
    });

    pool.on("error", (err) => {
      console.error("Error inesperado en el pool de PostgreSQL:", err);
      // Si el pool se vuelve inválido, lo reseteamos para la siguiente petición
      pool = null;
    });
  }
  return pool;
};

/**
 * Ejecuta una consulta SQL con reintento automático en caso de errores transitorios de conexión
 */
export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const maxRetries = 2;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const currentPool = getPool();
      return await currentPool.query<T>(text, params);
    } catch (err: any) {
      lastError = err;
      console.warn(`Intento ${attempt}/${maxRetries} falló en la consulta a la base de datos:`, err.message || err);

      // Si es un error de conexión (timeout, socket cerrado, connection terminated)
      const isConnectionError =
        err.code === "ECONNRESET" ||
        err.code === "ETIMEDOUT" ||
        err.code === "EPIPE" ||
        err.code === "57P01" || // admin_shutdown
        err.code === "53300" || // too_many_connections
        err.message?.includes("Connection terminated") ||
        err.message?.includes("timeout");

      if (isConnectionError && attempt < maxRetries) {
        // Reset pool para forzar una nueva conexión limpia
        if (pool) {
          try {
            await pool.end();
          } catch (_) {}
          pool = null;
        }
        // Espera corta antes de reintentar (250ms)
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
};

/**
 * Helper estándar para respuestas HTTP JSON en Lambda
 */
export const jsonResponse = (statusCode: number, data: any) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify(data),
  };
};
