import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { folders, type FolderRow } from "@/db/schema";
import { requireDbUser } from "@/lib/require-db-user";

const patchBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  sortOrder: z.number().int().optional(),
});

function rowToJson(row: FolderRow) {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.getTime(),
  };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const result = await requireDbUser();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  if (
    parsed.data.name === undefined &&
    parsed.data.sortOrder === undefined
  ) {
    return NextResponse.json({ error: "无有效字段" }, { status: 400 });
  }

  const db = getDb();
  const patch: Partial<{ name: string; sortOrder: number }> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name.trim();
  if (parsed.data.sortOrder !== undefined)
    patch.sortOrder = parsed.data.sortOrder;

  const [updated] = await db
    .update(folders)
    .set(patch)
    .where(
      and(eq(folders.id, id), eq(folders.userId, result.user.id)),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "未找到文件夹" }, { status: 404 });
  }

  return NextResponse.json(rowToJson(updated));
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const result = await requireDbUser();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }

  const { id } = await context.params;
  const db = getDb();
  const deleted = await db
    .delete(folders)
    .where(and(eq(folders.id, id), eq(folders.userId, result.user.id)))
    .returning({ id: folders.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "未找到文件夹" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
