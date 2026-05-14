import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { subscriptions, type SubscriptionRow } from "@/db/schema";
import { fetchRssFeedPayload, validateFeedUrl } from "@/lib/fetch-rss-feed";
import { requireDbUser } from "@/lib/require-db-user";

const postBodySchema = z.object({
  url: z.string().min(1),
  title: z.string().min(1).optional(),
});

function rowToJson(row: SubscriptionRow) {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
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
    .from(subscriptions)
    .where(eq(subscriptions.userId, result.user.id))
    .orderBy(desc(subscriptions.createdAt));

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

  const feedUrl = validateFeedUrl(parsed.data.url);
  if (!feedUrl) {
    return NextResponse.json(
      { error: "无效的订阅地址，请使用 http(s) URL。" },
      { status: 400 },
    );
  }

  let title = parsed.data.title?.trim();
  if (!title) {
    try {
      const payload = await fetchRssFeedPayload(feedUrl);
      title = payload.title;
    } catch (err) {
      const message = err instanceof Error ? err.message : "拉取失败";
      return NextResponse.json(
        { error: `无法验证订阅源：${message}` },
        { status: 502 },
      );
    }
  }

  const db = getDb();
  try {
    const [inserted] = await db
      .insert(subscriptions)
      .values({
        userId: result.user.id,
        url: feedUrl.toString(),
        title,
      })
      .returning();

    if (!inserted) {
      return NextResponse.json({ error: "插入失败" }, { status: 500 });
    }

    return NextResponse.json(rowToJson(inserted), { status: 201 });
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    if (code === "23505") {
      return NextResponse.json(
        { error: "该订阅地址已存在" },
        { status: 409 },
      );
    }
    throw err;
  }
}
