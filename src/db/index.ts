import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const sql = postgres(
  process.env.DATABASE_URL ?? "postgres://localhost:5432/inventory_demo"
);

export const db = drizzle(sql);
