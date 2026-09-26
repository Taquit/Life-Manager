import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { Resource } from "sst";
import { AppEnv } from "../types";

export const authMiddleware = async (c: Context<AppEnv>, next: Next) => {
  const authHeader = c.req.header("Authorization") || c.req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Token missing or invalid format" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret =
      (Resource as any).JWT_SECRET?.value ||
      process.env.JWT_SECRET ||
      "";

    const decoded = jwt.verify(token, secret) as {
      user_id?: string;
      userId?: string;
      id?: string;
    };

    const userId = decoded.user_id || decoded.userId || decoded.id;
    if (!userId) {
      return c.json({ error: "Invalid token payload: missing user identifier" }, 401);
    }

    c.set("userId", userId);
    await next();
  } catch (err: any) {
    return c.json({ error: "Invalid or expired token", details: err.message }, 401);
  }
};
