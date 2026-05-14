import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
import { requireDbUser } from "@/lib/require-db-user";

const patchBodySchema = z.object({
  title: z.string().min(1),
});

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

  const db = getDb();
  const [updated] = await db
    .update(subscriptions)
    .set({ title: parsed.data.title.trim() })
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.userId, result.user.id),
      ),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "未找到订阅" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    url: updated.url,
    title: updated.title,
    createdAt: updated.createdAt.getTime(),
  });
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
    .delete(subscriptions)
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.userId, result.user.id),
      ),
    )
    .returning({ id: subscriptions.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "未找到订阅" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
