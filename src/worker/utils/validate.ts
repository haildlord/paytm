import type { Context } from "hono";
import type { z } from "zod";
import { AppError } from "./AppError";

// Reads the JSON body and checks it against a zod schema.
// The first problem found becomes the error message the frontend shows.
export async function parseBody<T extends z.ZodType>(c: Context, schema: T): Promise<z.output<T>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new AppError("Request body must be valid JSON", 400);
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError(result.error.issues[0]?.message ?? "Incorrect or missing inputs", 400);
  }
  return result.data;
}
