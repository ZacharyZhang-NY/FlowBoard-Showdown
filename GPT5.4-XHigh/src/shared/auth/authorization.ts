import { and, eq } from "drizzle-orm";

import { db } from "@/db/index";
import { projectMembers } from "@/db/schema";
import { forbidden, notFound } from "@/src/shared/api/errors";
import type { MemberRole } from "@/src/shared/types/domain";

export async function getProjectMembership(
  userId: string,
  projectId: string,
): Promise<MemberRole | null> {
  const [membership] = await db
    .select({
      role: projectMembers.role,
    })
    .from(projectMembers)
    .where(
      and(eq(projectMembers.userId, userId), eq(projectMembers.projectId, projectId)),
    )
    .limit(1);

  return membership?.role ?? null;
}

export async function requireProjectMember(
  userId: string,
  projectId: string,
): Promise<MemberRole> {
  const membership = await getProjectMembership(userId, projectId);
  if (!membership) {
    throw notFound("Project not found");
  }

  return membership;
}

export async function requireProjectAdmin(
  userId: string,
  projectId: string,
): Promise<void> {
  const membership = await requireProjectMember(userId, projectId);
  if (membership !== "admin") {
    throw forbidden("Project admin access required");
  }
}
