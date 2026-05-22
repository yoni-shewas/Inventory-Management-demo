import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { inventory } from "@/src/db/schema";

type Item = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  price: number;
  imageUrl?: string | null;
};

export async function GET() {
  const items = await db.select().from(inventory);

  return NextResponse.json(items as Item[]);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await db
      .insert(inventory)
      .values(body)
      .returning();

    return NextResponse.json(result[0] as Item);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}