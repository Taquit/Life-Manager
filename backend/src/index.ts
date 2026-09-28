import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import type { Context as LambdaContext } from "aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { userRoutes } from "./routes/user";
import { transactionRoutes } from "./routes/transactions";
import { cardRoutes } from "./routes/cards";
import { categoryRoutes } from "./routes/categories";
import { serviceRoutes } from "./routes/services";
import { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// Global middlewares
app.use("*", cors());
app.use("*", logger());

// Health Check
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    runtime: "Hono Lambdalith on SST v4",
    timestamp: new Date().toISOString(),
  });
});

// Modular routing with singular and plural support
app.route("/user", userRoutes);
app.route("/transactions", transactionRoutes);
app.route("/transaction", transactionRoutes);
app.route("/card", cardRoutes);
app.route("/cards", cardRoutes);
app.route("/category", categoryRoutes);
app.route("/categories", categoryRoutes);
app.route("/service", serviceRoutes);
app.route("/services", serviceRoutes);

// Direct alias for summary report
app.get("/summary", async (c) => {
  return transactionRoutes.fetch(c.req.raw);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Ruta no encontrada", path: c.req.path }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error("API Gateway Lambdalith Error:", err);
  return c.json(
    {
      error: "Error interno del servidor",
      details: err.message,
    },
    500
  );
});

// Base Hono AWS Lambda adapter
const honoHandler = handle(app);

// Export AWS Lambda handler with callbackWaitsForEmptyEventLoop disabled
export const handler = async (event: any, context?: LambdaContext) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }
  return honoHandler(event, context);
};
