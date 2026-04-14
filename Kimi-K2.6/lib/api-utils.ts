import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 }
  );
}

export function forbidden() {
  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  );
}

export function badRequest(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}

export function notFound(message = "Resource not found") {
  return NextResponse.json(
    { error: message },
    { status: 404 }
  );
}

export function serverError(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

// Rate limiting: client IP + route -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: Request): boolean {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const url = new URL(request.url);
  const key = `${ip}:${url.pathname}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limit = 20;

  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > limit) {
    return true;
  }
  return false;
}

export function tooManyRequests() {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429 }
  );
}

export async function verifyProjectOwnership(projectId: string, userId: string): Promise<boolean> {
  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, projectId),
  });
  return project?.createdBy === userId;
}

export async function verifyBoardOwnership(boardId: string, userId: string): Promise<boolean> {
  const board = await db.query.boards.findFirst({
    where: eq(schema.boards.id, boardId),
    with: { project: true },
  });
  return board?.project?.createdBy === userId;
}

export async function verifyIssueOwnership(issueId: string, userId: string): Promise<boolean> {
  const issue = await db.query.issues.findFirst({
    where: eq(schema.issues.id, issueId),
    with: { project: true },
  });
  return issue?.project?.createdBy === userId;
}

export async function verifySprintOwnership(sprintId: string, userId: string): Promise<boolean> {
  const sprint = await db.query.sprints.findFirst({
    where: eq(schema.sprints.id, sprintId),
    with: { project: true },
  });
  return sprint?.project?.createdBy === userId;
}

export async function verifyCommentOwnership(commentId: string, userId: string): Promise<boolean> {
  const comment = await db.query.comments.findFirst({
    where: eq(schema.comments.id, commentId),
    with: { issue: { with: { project: true } } },
  });
  return comment?.issue?.project?.createdBy === userId;
}

export async function verifyColumnOwnership(columnId: string, userId: string): Promise<boolean> {
  const column = await db.query.columns.findFirst({
    where: eq(schema.columns.id, columnId),
    with: { board: { with: { project: true } } },
  });
  return column?.board?.project?.createdBy === userId;
}

export async function verifyLabelOwnership(labelId: string, userId: string): Promise<boolean> {
  const label = await db.query.labels.findFirst({
    where: eq(schema.labels.id, labelId),
    with: { project: true },
  });
  return label?.project?.createdBy === userId;
}
