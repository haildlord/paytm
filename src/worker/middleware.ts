import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import type { AppEnv } from "./types";
import { AppError } from "./utils/AppError";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Replaces jsonwebtoken.sign(). hono/jwt uses Web Crypto, so it runs on Workers.
export function signToken(userid: string, secret: string) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  return sign({ userid, exp }, secret, "HS256");
}

// Port of backend/middleware.js: reads "Authorization: Bearer <token>", verifies it,
// and exposes the user id to the route as c.get("userid") (Express: req.userid).
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authorization = c.req.header("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) throw new AppError("Missing or invalid token", 401);

  let payload;
  try {
    payload = await verify(token, c.env.JWT_SECRET, "HS256"); // also rejects expired tokens
  } catch {
    throw new AppError("Session expired or invalid. Please sign in again.", 401);
  }

  if (typeof payload.userid !== "string") throw new AppError("Missing or invalid token", 401);
  c.set("userid", payload.userid);
  await next();
});
