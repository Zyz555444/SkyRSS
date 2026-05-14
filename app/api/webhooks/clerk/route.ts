import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";

type WebhookUser = {
  id: string;
  primary_email_address_id?: string | null;
  email_addresses?: { id: string; email_address: string }[];
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
};

function primaryEmail(user: WebhookUser): string | null {
  const list = user.email_addresses ?? [];
  const primaryId = user.primary_email_address_id;
  return (
    list.find((e) => e.id === primaryId)?.email_address ??
    list[0]?.email_address ??
    null
  );
}

export async function POST(req: NextRequest) {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const db = getDb();

  if (evt.type === "user.deleted") {
    const id = (evt.data as { id?: string }).id;
    if (!id) {
      return new Response("Missing user id", { status: 400 });
    }
    await db.delete(users).where(eq(users.clerkId, id));
    return new Response(null, { status: 204 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const data = evt.data as WebhookUser;
    const email = primaryEmail(data);
    await db
      .insert(users)
      .values({
        clerkId: data.id,
        email,
        firstName: data.first_name ?? null,
        lastName: data.last_name ?? null,
        imageUrl: data.image_url ?? null,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
          firstName: data.first_name ?? null,
          lastName: data.last_name ?? null,
          imageUrl: data.image_url ?? null,
          updatedAt: new Date(),
        },
      });
    return new Response(null, { status: 204 });
  }

  return new Response(null, { status: 204 });
}
