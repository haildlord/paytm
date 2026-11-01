import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware";
import type { AppEnv } from "../types";
import { AppError } from "../utils/AppError";
import { parseBody } from "../utils/validate";

// Port of backend/routes/account.js. Mounted at /api/v1/account. Every route needs a token.
const router = new Hono<AppEnv>();
router.use(authMiddleware);

const transferBody = z.object({
  amount: z
    .number({ error: "Amount must be a number" })
    .int("Amount must be a whole number of rupees")
    .positive("Amount must be greater than 0")
    .max(1_000_000_000, "Amount is too large"),
  to: z.string({ error: "Recipient is required" }).min(1, "Recipient is required"),
});

// GET /user-info: the signed-in user's profile and balance.
router.get("/user-info", async (c) => {
  const info = await c.env.DB.prepare(
    `SELECT a.balance, u.firstname, u.lastname, u.username, u.id AS userid
       FROM users u
       JOIN accounts a ON a.user_id = u.id
      WHERE u.id = ?`,
  )
    .bind(c.get("userid"))
    .first();

  if (!info) throw new AppError("User or account not found", 404);
  return c.json(info);
});

// POST /transfer: move money from the signed-in user to `to`, all or nothing.
//
// main does this with a MongoDB session: read both accounts, check the balance, $inc both,
// commit. Here the three writes go in one D1 batch, which is a single SQL transaction, and
// the table constraints act as the checks:
//   1. debit the sender   -> CHECK (balance >= 0) fails if they can't afford it
//   2. credit the receiver
//   3. record the transfer -> FOREIGN KEY fails if either account doesn't exist
// If any statement fails, the whole batch rolls back and no balance changes.
// Because the check and the debit are the same statement, two transfers sent at the same
// moment can't both spend the same money.
router.post("/transfer", async (c) => {
  const { amount, to } = await parseBody(c, transferBody);
  const from = c.get("userid");
  if (to === from) throw new AppError("You can't send money to yourself", 400);

  const db = c.env.DB;
  try {
    await db.batch([
      db.prepare("UPDATE accounts SET balance = balance - ?1 WHERE user_id = ?2").bind(amount, from),
      db.prepare("UPDATE accounts SET balance = balance + ?1 WHERE user_id = ?2").bind(amount, to),
      db
        .prepare("INSERT INTO transfers (id, from_user, to_user, amount) VALUES (?, ?, ?, ?)")
        .bind(crypto.randomUUID(), from, to, amount),
    ]);
  } catch (err) {
    const message = String(err);
    if (message.includes("CHECK constraint failed")) throw new AppError("Insufficient balance", 400);
    if (message.includes("FOREIGN KEY constraint failed")) throw new AppError("Invalid account", 400);
    throw err;
  }

  return c.json({ message: "Transfer successful" });
});

export default router;
