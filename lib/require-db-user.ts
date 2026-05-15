import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, type UserRow } from "@/db/schema";

function primaryEmailFromClerkUser(
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
) {
  const primaryId = user.primaryEmailAddressId;
  const primary =
    user.emailAddresses.find((e) => e.id === primaryId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;
  return primary ?? null;
}

function isMissingUsersTableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const o = err as {
    code?: string;
    message?: string;
    cause?: unknown;
  };
  if (o.code === "42P01") return true;
  if (
    typeof o.message === "string" &&
    (o.message.includes('relation "users" does not exist') ||
      o.message.includes("relation \"users\" does not exist"))
  ) {
    return true;
  }
  if (o.cause) return isMissingUsersTableError(o.cause);
  return false;
}

export type RequireDbUserResult =
  | { ok: true; user: UserRow }
  | { ok: false; status: number; message: string };

export async function requireDbUser(): Promise<RequireDbUserResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, status: 401, message: "未登录" };
  }

  try {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (existing) {
      return { ok: true, user: existing };
    }

    const info = await currentUser();
    if (!info) {
      return { ok: false, status: 401, message: "未登录" };
    }

    const email = primaryEmailFromClerkUser(info);

    const [row] = await db
      .insert(users)
      .values({
        clerkId: userId,
        email,
        firstName: info.firstName,
        lastName: info.lastName,
        imageUrl: info.imageUrl,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
          firstName: info.firstName,
          lastName: info.lastName,
          imageUrl: info.imageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!row) {
      return { ok: false, status: 500, message: "无法创建用户记录" };
    }

    return { ok: true, user: row };
  } catch (err) {
    if (isMissingUsersTableError(err)) {
      return {
        ok: false,
        status: 503,
        message:
          "数据库尚未建表。请在配置 DATABASE_URL 后于本机执行 npm run db:migrate，或在 Neon 控制台的 SQL Editor 中执行 drizzle/0000_init.sql 中的全部语句。",
      };
    }
    console.error("[requireDbUser]", err);
    return { ok: false, status: 500, message: "数据库暂时不可用" };
  }
}
