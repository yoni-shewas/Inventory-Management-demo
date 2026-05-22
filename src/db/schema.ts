import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  price: integer("price").notNull(), // in cents
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});