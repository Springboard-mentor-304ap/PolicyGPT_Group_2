import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const policyRecords = pgTable("policy_records", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  ministry: text("ministry").notNull(),
  state: text("state").notNull(),
  status: text("status").notNull(),
  publishedDate: text("published_date").notNull(),
  summary: text("summary").notNull(),
  tags: text("tags").array().notNull().default([]),
  impact: text("impact").notNull(),
  sourceDocumentPath: text("source_document_path"),
});

export const publicSchemes = pgTable("public_schemes", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  ministry: text("ministry").notNull(),
  state: text("state").notNull(),
  benefit: text("benefit").notNull(),
  deadline: text("deadline").notNull(),
  beneficiaries: text("beneficiaries").notNull(),
  eligibility: text("eligibility").array().notNull().default([]),
  description: text("description").notNull(),
  steps: text("steps").array().notNull().default([]),
});

export const policyNotifications = pgTable("policy_notifications", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  time: text("time").notNull(),
  read: boolean("read").notNull().default(false),
  type: text("type").notNull(),
});

export const policyActivities = pgTable("policy_activities", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  time: text("time").notNull(),
  type: text("type").notNull(),
});

export const policyFeedback = pgTable("policy_feedback", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("Received"),
  clerkUserId: text("clerk_user_id"),
});

export const policyUserProfiles = pgTable("policy_user_profiles", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  role: text("role").notNull().default("citizen_researcher"),
  displayName: text("display_name"),
  email: text("email"),
});