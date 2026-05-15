import { auth } from "@clerk/nextjs/server";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { folders, type FolderRow } from "@/db/schema";
import { requireDbUser } from "@/lib/require-db-user";

const postBodySchema = z.object({
  name: z.string().min(1).max(120),
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

export async function GET() {
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

  const db = getDb();
  const rows = await db
    .select()
    .from(folders)
    .where(eq(folders.userId, result.user.id))
    .orderBy(asc(folders.sortOrder), asc(folders.createdAt));

  return NextResponse.json(rows.map(rowToJson));
}

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const db = getDb();
  const [inserted] = await db
    .insert(folders)
    .values({
      userId: result.user.id,
      name: parsed.data.name.trim(),
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();

  if (!inserted) {
    return NextResponse.json({ error: "插入失败" }, { status: 500 });
  }

  return NextResponse.json(rowToJson(inserted), { status: 201 });
}
