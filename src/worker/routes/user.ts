import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, signToken } from "../middleware";
import type { AppEnv } from "../types";
import { AppError } from "../utils/AppError";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../utils/password";
import { parseBody } from "../utils/validate";

// Port of backend/routes/user.js. Mounted at /api/v1/user.
const router = new Hono<AppEnv>();

const name = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(3, `${label} must be at least 3 characters long`)
    .max(50, `${label} must be at most 50 characters long`);

// The password is hashed exactly as typed (not trimmed), the same as on main.
const password = z
  .string({ error: "Password is required" })
  .max(128, "Password must be at most 128 characters long")
  .refine((value) => value.trim().length >= 3, "Password must be at least 3 characters long");

const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(254, "Email is too long"));

const signupBody = z.object({ username: email, firstname: name("First name"), lastname: name("Last name"), password });

const required = "Username and password are required";
const signinBody = z.object({
  username: z.string({ error: required }).trim().toLowerCase().min(1, required),
  password: z.string({ error: required }).min(1, required),
});

const updateBody = z
  .object({ firstname: name("First name").optional(), lastname: name("Last name").optional(), password: password.optional() })
  .refine((data) => Object.values(data).some((value) => value !== undefined), "At least one field is required");

// POST /signup: create the user and their wallet together, return a token.
router.post("/signup", async (c) => {
  const { username, firstname, lastname, password } = await parseBody(c, signupBody);
  const db = c.env.DB;

  const taken = await db.prepare("SELECT 1 FROM users WHERE username = ?").bind(username).first();
  if (taken) throw new AppError("Email already taken", 409);

  const userid = crypto.randomUUID();
  const hashedPassword = await hashPassword(password);
  const startingBalance = Math.floor(Math.random() * 10000) + 1; // same as main: ₹1 to ₹10,000

  // batch() runs as one transaction: there is never a user without a wallet.
  try {
    await db.batch([
      db
        .prepare("INSERT INTO users (id, username, password, firstname, lastname) VALUES (?, ?, ?, ?, ?)")
        .bind(userid, username, hashedPassword, firstname, lastname),
      db.prepare("INSERT INTO accounts (user_id, balance) VALUES (?, ?)").bind(userid, startingBalance),
    ]);
  } catch (err) {
    // Two signups with the same email at the same moment: the UNIQUE constraint catches the second.
    if (String(err).includes("UNIQUE constraint failed")) throw new AppError("Email already taken", 409);
    throw err;
  }

  const token = await signToken(userid, c.env.JWT_SECRET);
  return c.json({ message: "User created successfully", token }, 201);
});

// POST /signin: check the password, return a token.
router.post("/signin", async (c) => {
  const { username, password } = await parseBody(c, signinBody);

  const user = await c.env.DB.prepare("SELECT id, password FROM users WHERE username = ?")
    .bind(username)
    .first<{ id: string; password: string }>();

  // Always run the hash check, even for unknown emails, so both failures look the same.
  const valid = await verifyPassword(password, user?.password ?? DUMMY_HASH);
  if (!user || !valid) throw new AppError("Invalid username or password", 401);

  const token = await signToken(user.id, c.env.JWT_SECRET);
  return c.json({ message: "Login successful", token });
});

// PUT /update: change first name, last name and/or password.
router.put("/update", authMiddleware, async (c) => {
  const { firstname, lastname, password } = await parseBody(c, updateBody);
  const hashedPassword = password === undefined ? null : await hashPassword(password);

  // COALESCE keeps the current value for any field that wasn't sent.
  await c.env.DB.prepare(
    `UPDATE users
        SET firstname = COALESCE(?1, firstname),
            lastname  = COALESCE(?2, lastname),
            password  = COALESCE(?3, password)
      WHERE id = ?4`,
  )
    .bind(firstname ?? null, lastname ?? null, hashedPassword, c.get("userid"))
    .run();

  return c.json({ message: "Updated successfully" });
});

// GET /bulk?filter=: search other users by name for the "Send Money" list.
router.get("/bulk", authMiddleware, async (c) => {
  const filter = (c.req.query("filter") ?? "").trim().slice(0, 50);
  // LIKE wildcards in the search text are escaped, so "%" matches a literal "%".
  const pattern = `%${filter.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;

  const { results } = await c.env.DB.prepare(
    `SELECT id AS _id, firstname, lastname
       FROM users
      WHERE id <> ?1
        AND (firstname || ' ' || lastname) LIKE ?2 ESCAPE '\\'
      ORDER BY firstname, lastname
      LIMIT 50`,
  )
    .bind(c.get("userid"), pattern)
    .all<{ _id: string; firstname: string; lastname: string }>();

  return c.json({ users: results });
});

export default router;
