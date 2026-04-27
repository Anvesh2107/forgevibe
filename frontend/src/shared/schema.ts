import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  githubId: text("github_id").notNull().unique(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  bio: text("bio"),
  publicRepoCount: integer("public_repo_count").default(0),
  followerCount: integer("follower_count").default(0),
  githubCreatedAt: text("github_created_at"),
  primaryLanguages: text("primary_languages").default("[]"), // JSON array
  reputationPoints: integer("reputation_points").default(0),
  verified: integer("verified", { mode: "boolean" }).default(false),
  postRestrictedUntil: text("post_restricted_until"),
  violationCount: integer("violation_count").default(0),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  githubUrl: text("github_url").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  coverImageUrl: text("cover_image_url"),
  githubStars: integer("github_stars").default(0),
  aiScore: real("ai_score"),
  likeCount: integer("like_count").default(0),
  diamondCount: integer("diamond_count").default(0),
  commentCount: integer("comment_count").default(0),
  forgevibeScore: real("forgevibe_score").default(0),
  status: text("status").default("active"), // active | removed | pending
  analysisStatus: text("analysis_status").default("pending"), // pending | analyzing | complete | failed
  tags: text("tags").default("[]"), // JSON array
  createdAt: text("created_at").notNull(),
  weeklyRankChange: integer("weekly_rank_change").default(0),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, likeCount: true, diamondCount: true, commentCount: true, forgevibeScore: true, analysisStatus: true, aiScore: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// ─── Project Analyses ──────────────────────────────────────────────────────────
export const projectAnalyses = sqliteTable("project_analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  architectureScore: real("architecture_score"),
  securityScore: real("security_score"),
  qualityScore: real("quality_score"),
  docsScore: real("docs_score"),
  overallScore: real("overall_score"),
  summary: text("summary"),
  strengths: text("strengths").default("[]"), // JSON array
  improvements: text("improvements").default("[]"), // JSON array
  vibeCheck: text("vibe_check"), // plain English for non-devs
  completedAt: text("completed_at"),
});

export const insertProjectAnalysisSchema = createInsertSchema(projectAnalyses).omit({ id: true });
export type InsertProjectAnalysis = z.infer<typeof insertProjectAnalysisSchema>;
export type ProjectAnalysis = typeof projectAnalyses.$inferSelect;

// ─── Diamonds ─────────────────────────────────────────────────────────────────
export const diamonds = sqliteTable("diamonds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  giverId: integer("giver_id").notNull(),
  projectId: integer("project_id").notNull(),
  note: text("note"), // max 50 chars
  givenAt: text("given_at").notNull(),
  weekKey: text("week_key").notNull(), // e.g. "2026-W17" for uniqueness per week
});

export const insertDiamondSchema = createInsertSchema(diamonds).omit({ id: true });
export type InsertDiamond = z.infer<typeof insertDiamondSchema>;
export type Diamond = typeof diamonds.$inferSelect;

// ─── Likes ────────────────────────────────────────────────────────────────────
export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertLikeSchema = createInsertSchema(likes).omit({ id: true });
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;

// ─── Comments ─────────────────────────────────────────────────────────────────
export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  body: text("body").notNull(),
  upvotes: integer("upvotes").default(0),
  createdAt: text("created_at").notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, upvotes: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// ─── Thought Posts ────────────────────────────────────────────────────────────
export const thoughtPosts = sqliteTable("thought_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  aiConfidence: real("ai_confidence"),
  aiReason: text("ai_reason"),
  status: text("status").default("pending"), // pending | published | blocked | appeal
  createdAt: text("created_at").notNull(),
});

export const insertThoughtPostSchema = createInsertSchema(thoughtPosts).omit({ id: true, aiConfidence: true, aiReason: true, status: true });
export type InsertThoughtPost = z.infer<typeof insertThoughtPostSchema>;
export type ThoughtPost = typeof thoughtPosts.$inferSelect;

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reporterId: integer("reporter_id").notNull(),
  contentType: text("content_type").notNull(), // project | thought_post
  contentId: integer("content_id").notNull(),
  reason: text("reason").notNull(),
  notes: text("notes"),
  status: text("status").default("pending"), // pending | approved | rejected
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").notNull(),
});

export const insertReportSchema = createInsertSchema(reports).omit({ id: true, status: true, reviewedAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // analysis_complete | liked | diamond | commented | post_approved | post_rejected | appeal
  payload: text("payload").default("{}"), // JSON
  read: integer("read", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, read: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
