import type { IssueStatus } from "@/src/shared/types/domain";

export const defaultBoardColumns = [
  {
    name: "To Do",
    color: "gray",
    status: "todo",
    wipLimit: null,
  },
  {
    name: "In Progress",
    color: "blue",
    status: "in_progress",
    wipLimit: 4,
  },
  {
    name: "In Review",
    color: "purple",
    status: "in_review",
    wipLimit: null,
  },
  {
    name: "Done",
    color: "green",
    status: "done",
    wipLimit: null,
  },
] as const satisfies ReadonlyArray<{
  name: string;
  color: string;
  status: IssueStatus;
  wipLimit: number | null;
}>;

const columnStatusMap = new Map<string, IssueStatus>(
  defaultBoardColumns.map((column) => [column.name.toLowerCase(), column.status]),
);

export function inferStatusFromColumnName(name: string): IssueStatus | null {
  return columnStatusMap.get(name.trim().toLowerCase()) ?? null;
}
