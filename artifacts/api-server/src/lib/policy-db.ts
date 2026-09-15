import { count, desc, eq } from "drizzle-orm";
import {
  db,
  policyActivities,
  policyFeedback,
  policyNotifications,
  policyRecords,
  publicSchemes,
} from "@workspace/db";
import type {
  ActivityItem,
  DashboardSummary,
  Feedback,
  Notification,
  Policy,
  Scheme,
} from "@workspace/api-zod";
import {
  activities as seedActivities,
  coverage,
  notifications as seedNotifications,
  policies as seedPolicies,
  schemes as seedSchemes,
  trend,
} from "./policy-data";

let seedPromise: Promise<void> | undefined;

export function ensurePolicyData() {
  seedPromise ??= seedDatabase();
  return seedPromise;
}

async function seedDatabase() {
  const [policyCount] = await db.select({ value: count() }).from(policyRecords);
  if (Number(policyCount?.value ?? 0) === 0) {
    await db
      .insert(policyRecords)
      .values(
        seedPolicies.map((policy) => ({
          ...policy,
          impact: policy.impact ?? "Moderate",
          sourceDocumentPath: null,
        })),
      )
      .onConflictDoNothing();
  }

  const [schemeCount] = await db.select({ value: count() }).from(publicSchemes);
  if (Number(schemeCount?.value ?? 0) === 0) {
    await db.insert(publicSchemes).values(seedSchemes).onConflictDoNothing();
  }

  const [notificationCount] = await db
    .select({ value: count() })
    .from(policyNotifications);
  if (Number(notificationCount?.value ?? 0) === 0) {
    await db
      .insert(policyNotifications)
      .values(seedNotifications)
      .onConflictDoNothing();
  }

  const [activityCount] = await db
    .select({ value: count() })
    .from(policyActivities);
  if (Number(activityCount?.value ?? 0) === 0) {
    await db.insert(policyActivities).values(seedActivities).onConflictDoNothing();
  }
}

function toPolicy(row: typeof policyRecords.$inferSelect): Policy {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    ministry: row.ministry,
    state: row.state,
    status: row.status,
    publishedDate: row.publishedDate,
    summary: row.summary,
    tags: row.tags ?? [],
    impact: row.impact,
  };
}

function toScheme(row: typeof publicSchemes.$inferSelect): Scheme {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    ministry: row.ministry,
    state: row.state,
    benefit: row.benefit,
    deadline: row.deadline,
    beneficiaries: row.beneficiaries,
    eligibility: row.eligibility ?? [],
    description: row.description,
    steps: row.steps ?? [],
  };
}

function toNotification(
  row: typeof policyNotifications.$inferSelect,
): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    time: row.time,
    read: row.read,
    type: row.type,
  };
}

function toActivity(row: typeof policyActivities.$inferSelect): ActivityItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    time: row.time,
    type: row.type,
  };
}

export async function listPolicies(): Promise<Policy[]> {
  await ensurePolicyData();
  return (await db.select().from(policyRecords)).map(toPolicy);
}

export async function getPolicy(id: number): Promise<Policy | undefined> {
  await ensurePolicyData();
  const [row] = await db
    .select()
    .from(policyRecords)
    .where(eq(policyRecords.id, id))
    .limit(1);
  return row ? toPolicy(row) : undefined;
}

export async function createPolicy(
  input: Omit<Policy, "id">,
): Promise<Policy> {
  await ensurePolicyData();
  const [last] = await db
    .select({ id: policyRecords.id })
    .from(policyRecords)
    .orderBy(desc(policyRecords.id))
    .limit(1);
  const id = (last?.id ?? 100) + 1;
  const [row] = await db
    .insert(policyRecords)
    .values({
      id,
      title: input.title,
      category: input.category,
      ministry: input.ministry,
      state: input.state,
      status: input.status,
      publishedDate: input.publishedDate,
      summary: input.summary,
      tags: input.tags,
      impact: input.impact ?? "Pending",
    })
    .returning();
  return toPolicy(row);
}

export async function updatePolicy(
  id: number,
  input: Partial<Pick<Policy, "status">>,
): Promise<Policy | undefined> {
  await ensurePolicyData();
  const [row] = await db
    .update(policyRecords)
    .set(input)
    .where(eq(policyRecords.id, id))
    .returning();
  return row ? toPolicy(row) : undefined;
}

export async function listSchemes(): Promise<Scheme[]> {
  await ensurePolicyData();
  return (await db.select().from(publicSchemes)).map(toScheme);
}

export async function getScheme(id: number): Promise<Scheme | undefined> {
  await ensurePolicyData();
  const [row] = await db
    .select()
    .from(publicSchemes)
    .where(eq(publicSchemes.id, id))
    .limit(1);
  return row ? toScheme(row) : undefined;
}

export async function listNotifications(): Promise<Notification[]> {
  await ensurePolicyData();
  return (await db.select().from(policyNotifications)).map(toNotification);
}

export async function markNotificationRead(
  id: number,
): Promise<Notification | undefined> {
  await ensurePolicyData();
  const [row] = await db
    .update(policyNotifications)
    .set({ read: true })
    .where(eq(policyNotifications.id, id))
    .returning();
  return row ? toNotification(row) : undefined;
}

export async function listActivity(): Promise<ActivityItem[]> {
  await ensurePolicyData();
  return (await db.select().from(policyActivities)).map(toActivity);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await ensurePolicyData();
  const [[policyTotal], [schemeTotal], [unreadTotal]] = await Promise.all([
    db.select({ value: count() }).from(policyRecords),
    db.select({ value: count() }).from(publicSchemes),
    db
      .select({ value: count() })
      .from(policyNotifications)
      .where(eq(policyNotifications.read, false)),
  ]);

  return {
    policyCount: Number(policyTotal?.value ?? 0) + 86,
    schemeCount: Number(schemeTotal?.value ?? 0) + 42,
    activeAlerts: Number(unreadTotal?.value ?? 0),
    savedItems: 12,
    trend,
    coverage,
  };
}

export async function createFeedback(
  input: Omit<Feedback, "id" | "status">,
  clerkUserId?: string,
): Promise<Feedback> {
  await ensurePolicyData();
  const [row] = await db
    .insert(policyFeedback)
    .values({ ...input, clerkUserId, status: "Received" })
    .returning();
  return {
    id: row.id,
    subject: row.subject,
    message: row.message,
    category: row.category,
    status: row.status,
  };
}