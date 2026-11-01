import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import accountRouter from "./routes/account";
import userRouter from "./routes/user";
import type { AppEnv } from "./types";
import { AppError } from "./utils/AppError";

// Port of backend/index.js. Static files (the React app) never reach this code:
// wrangler.jsonc sends only /api/* to the worker. No CORS middleware is needed,
// because the app and the API share one origin.
const app = new Hono<AppEnv>().basePath("/api");

app.use(secureHeaders());
app.use(async (c, next) => {
  await next();
  c.header("Cache-Control", "no-store"); // balances and tokens must never be cached
});
app.use(
  bodyLimit({
    maxSize: 8 * 1024,
    onError: (c) => c.json({ success: false, message: "Request body too large" }, 413),
  }),
);

app.get("/health", async (c) => {
  await c.env.DB.prepare("SELECT 1").first();
  return c.json({ ok: true });
});

// Same route tree as rootRouter on main: /api/v1/user/* and /api/v1/account/*
const v1 = new Hono<AppEnv>();
v1.route("/user", userRouter);
v1.route("/account", accountRouter);
app.route("/v1", v1);

app.notFound((c) => c.json({ success: false, message: `Not found: ${c.req.method} ${c.req.path}` }, 404));

// The central error handler, like the Express (err, req, res, next) middleware on main.
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ success: false, message: err.message }, err.statusCode);
  }
  if (err instanceof HTTPException) {
    return c.json({ success: false, message: err.message }, err.status);
  }
  console.error(err);
  return c.json({ success: false, message: "Internal Server Error" }, 500);
});

export default app;
