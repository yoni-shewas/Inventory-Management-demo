import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { inventory } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    await db
      .update(inventory)
      .set(body)
      .where(eq(inventory.id, Number(params.id)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db
      .delete(inventory)
      .where(eq(inventory.id, Number(params.id)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}