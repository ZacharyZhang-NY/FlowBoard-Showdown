import { toIsoStringRequired } from "@/src/shared/utils/date";

export function mapUserSummary(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
  };
}

export function mapTag(label: {
  id: string;
  name: string;
  color: string;
}) {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
  };
}

export function mapActivityItem(activity: {
  id: string;
  action: string;
  requestId: string;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
  };
  issue?: {
    id: string;
    number: number;
    title: string;
    project: {
      key: string;
    };
  } | null;
  oldValue: string | null;
  newValue: string | null;
}) {
  return {
    id: activity.id,
    action: activity.action,
    requestId: activity.requestId,
    createdAt: toIsoStringRequired(activity.createdAt),
    actor: mapUserSummary(activity.actor),
    issueId: activity.issue?.id ?? null,
    issueKey: activity.issue ? `${activity.issue.project.key}-${activity.issue.number}` : null,
    issueTitle: activity.issue?.title ?? null,
    oldValue: activity.oldValue,
    newValue: activity.newValue,
  };
}
