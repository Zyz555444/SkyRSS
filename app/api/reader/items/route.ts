import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { readerItems, subscriptions, type ReaderItemRow } from "@/db/schema";
import { requireDbUser } from "@/lib/require-db-user";

const patchItemSchema = z.object({
  subscriptionId: z.string().uuid(),
  itemKey: z.string().min(1).max(2048),
  title: z.string().max(4000),
  link: z.string().max(8000).nullable().optional(),
  snippet: z.string().max(16000).nullable().optional(),
  feedTitle: z.string().max(2000),
  read: z.boolean().optional(),
  favorite: z.boolean().optional(),
  readLater: z.boolean().optional(),
  markOpened: z.boolean().optional(),
});

const patchBodySchema = z.object({
  items: z.array(patchItemSchema).max(500),
});

function rowToJson(row: ReaderItemRow) {
  return {
    id: row.id,
    subscriptionId: row.subscriptionId,
    itemKey: row.itemKey,
    title: row.title,
    link: row.link,
    snippet: row.snippet,
    feedTitle: row.feedTitle,
    readAt: row.readAt ? row.readAt.getTime() : null,
    favorite: row.favorite,
    readLater: row.readLater,
    lastOpenedAt: row.lastOpenedAt ? row.lastOpenedAt.getTime() : null,
    updatedAt: row.updatedAt.getTime(),
  };
}

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter");

  const db = getDb();

  const whereExpr =
    filter === "active"
      ? and(
          eq(readerItems.userId, result.user.id),
          or(
            eq(readerItems.favorite, true),
            eq(readerItems.readLater, true),
            sql`${readerItems.lastOpenedAt} is not null`,
          ),
        )
      : eq(readerItems.userId, result.user.id);

  const rows = await db
    .select()
    .from(readerItems)
    .where(whereExpr)
    .orderBy(desc(readerItems.updatedAt));

  return NextResponse.json(rows.map(rowToJson));
}

export async function PATCH(request: Request) {
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

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const db = getDb();
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      for (const it of parsed.data.items) {
        const [sub] = await tx
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.id, it.subscriptionId),
              eq(subscriptions.userId, result.user.id),
            ),
          )
          .limit(1);

        if (!sub) {
          throw new Error(`无效订阅: ${it.subscriptionId}`);
        }

        const [existing] = await tx
          .select()
          .from(readerItems)
          .where(
            and(
              eq(readerItems.userId, result.user.id),
              eq(readerItems.subscriptionId, it.subscriptionId),
              eq(readerItems.itemKey, it.itemKey),
            ),
          )
          .limit(1);

        const readAt =
          it.read === true
            ? now
            : it.read === false
              ? null
              : (existing?.readAt ?? null);

        const favorite =
          it.favorite !== undefined
            ? it.favorite
            : (existing?.favorite ?? false);
        const readLater =
          it.readLater !== undefined
            ? it.readLater
            : (existing?.readLater ?? false);

        const lastOpenedAt = it.markOpened
          ? now
          : (existing?.lastOpenedAt ?? null);

        const title = it.title;
        const link = it.link ?? null;
        const snippet = it.snippet ?? null;
        const feedTitle = it.feedTitle;

        if (existing) {
          await tx
            .update(readerItems)
            .set({
              title,
              link,
              snippet,
              feedTitle,
              readAt,
              favorite,
              readLater,
              lastOpenedAt,
            })
            .where(eq(readerItems.id, existing.id));
        } else {
          await tx.insert(readerItems).values({
            userId: result.user.id,
            subscriptionId: it.subscriptionId,
            itemKey: it.itemKey,
            title,
            link,
            snippet,
            feedTitle,
            readAt,
            favorite,
            readLater,
            lastOpenedAt,
          });
        }
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "更新失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
