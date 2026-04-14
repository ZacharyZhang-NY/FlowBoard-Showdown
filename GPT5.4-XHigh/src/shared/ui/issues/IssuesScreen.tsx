"use client";

import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ComposedModal,
  Dropdown,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Pagination,
  Search,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
  Tile,
} from "@carbon/react";

import type { CreateIssueRequest } from "@/src/modules/issues/contract/issue.schemas";
import { PageLayout } from "@/src/shared/ui/app/PageLayout";
import { PriorityTag, StatusTag } from "@/src/shared/ui/app/Tags";
import { useBoardsSuspense } from "@/src/state/query/useBoards";
import { useCreateIssueMutation, useIssuesSuspense } from "@/src/state/query/useIssues";
import { useCurrentProjectSuspense } from "@/src/state/query/useProjects";
import { useSprintsSuspense } from "@/src/state/query/useSprints";

const sortableColumns = [
  { key: "number", label: "Key" },
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "type", label: "Type" },
  { key: "storyPoints", label: "Story Points" },
  { key: "dueDate", label: "Due Date" },
  { key: "updatedAt", label: "Updated" },
] as const;

type SelectOption<TValue extends string = string> = {
  id: TValue;
  label: string;
};

const statusFilterOptions: SelectOption[] = [
  { id: "", label: "All statuses" },
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
  { id: "blocked", label: "Blocked" },
] ;

const priorityFilterOptions: SelectOption[] = [
  { id: "", label: "All priorities" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
] ;

const typeFilterOptions: SelectOption[] = [
  { id: "", label: "All types" },
  { id: "task", label: "Task" },
  { id: "bug", label: "Bug" },
  { id: "feature", label: "Feature" },
  { id: "improvement", label: "Improvement" },
] ;

type CurrentProject = NonNullable<ReturnType<typeof useCurrentProjectSuspense>["currentProject"]>;
type IssuePriority = CreateIssueRequest["priority"];
type IssueType = CreateIssueRequest["type"];

const createPriorityOptions: SelectOption<IssuePriority>[] = [
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

const createTypeOptions: SelectOption<IssueType>[] = [
  { id: "task", label: "Task" },
  { id: "bug", label: "Bug" },
  { id: "feature", label: "Feature" },
  { id: "improvement", label: "Improvement" },
];

export function IssuesScreen() {
  const { currentProject } = useCurrentProjectSuspense();

  if (!currentProject) {
    return null;
  }

  return <IssuesScreenContent currentProject={currentProject} />;
}

function IssuesScreenContent({ currentProject }: { currentProject: CurrentProject }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [sortBy, setSortBy] =
    useState<(typeof sortableColumns)[number]["key"]>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueBoardId, setNewIssueBoardId] = useState("");
  const [newIssueColumnId, setNewIssueColumnId] = useState<string | null>(null);
  const [newIssuePriority, setNewIssuePriority] = useState<IssuePriority>("medium");
  const [newIssueType, setNewIssueType] = useState<IssueType>("task");

  const { data: boards } = useBoardsSuspense(currentProject.id);
  const { data: sprints } = useSprintsSuspense(currentProject.id);
  const { data: issues } = useIssuesSuspense(currentProject.id, {
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(type ? { type } : {}),
    ...(sprintId ? { sprintId } : {}),
    sortBy,
    sortDirection,
  });
  const createIssueMutation = useCreateIssueMutation(currentProject.id);

  const boardOptions = boards.map((board) => ({
    id: board.id,
    label: board.name,
  }));
  const selectedBoard = boards.find((board) => board.id === newIssueBoardId) ?? null;
  const columnOptions = useMemo(() => {
    return selectedBoard ? [] : [{ id: "", label: "No columns available" }];
  }, [selectedBoard]);

  return (
    <PageLayout
      actions={
        <Button
          onClick={() => {
            setNewIssueBoardId(boards[0]?.id ?? "");
            setCreateModalOpen(true);
          }}
        >
          New issue
        </Button>
      }
      description="Track, filter and sort project issues."
      summary={
        <div className="flowboard-filter-row">
          <Search
            closeButtonLabelText="Clear search"
            id="issues-search"
            labelText=""
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search issues"
            value={search}
          />
          <Dropdown
            id="issues-status"
            itemToString={(item) => item?.label ?? ""}
            items={statusFilterOptions}
            label="Status"
            onChange={({ selectedItem }) => {
              setStatus((selectedItem as SelectOption | null)?.id ?? "");
              setPage(1);
            }}
            titleText="Status"
          />
          <Dropdown
            id="issues-priority"
            itemToString={(item) => item?.label ?? ""}
            items={priorityFilterOptions}
            label="Priority"
            onChange={({ selectedItem }) => {
              setPriority((selectedItem as SelectOption | null)?.id ?? "");
              setPage(1);
            }}
            titleText="Priority"
          />
          <Dropdown
            id="issues-type"
            itemToString={(item) => item?.label ?? ""}
            items={typeFilterOptions}
            label="Type"
            onChange={({ selectedItem }) => {
              setType((selectedItem as SelectOption | null)?.id ?? "");
              setPage(1);
            }}
            titleText="Type"
          />
          <Dropdown
            id="issues-sprint"
            itemToString={(item) => item?.label ?? ""}
            items={[
              { id: "", label: "All sprints" },
              ...sprints.items.map((sprint) => ({ id: sprint.id, label: sprint.name })),
            ]}
            label="Sprint"
            onChange={({ selectedItem }) => {
              setSprintId((selectedItem as SelectOption | null)?.id ?? "");
              setPage(1);
            }}
            titleText="Sprint"
          />
        </div>
      }
      title="Issues"
    >
      <Tile className="flowboard-panel">
        <TableContainer title={currentProject.name}>
          <Table size="lg" useZebraStyles>
            <TableHead>
              <TableRow>
                {sortableColumns.map((column) => (
                  <TableHeader
                    key={column.key}
                    onClick={() => {
                      if (sortBy === column.key) {
                        setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
                        return;
                      }

                      setSortBy(column.key);
                      setSortDirection("asc");
                    }}
                  >
                    {column.label}
                  </TableHeader>
                ))}
                <TableHeader>Assignee</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {issues.items.map((issue) => (
                <TableRow
                  className="flowboard-clickable-row"
                  key={issue.id}
                  onClick={() => {
                    router.push(`/issues/${issue.id}`);
                  }}
                >
                  <TableCell>{issue.key}</TableCell>
                  <TableCell>{issue.title}</TableCell>
                  <TableCell>
                    <StatusTag status={issue.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityTag priority={issue.priority} />
                  </TableCell>
                  <TableCell>{issue.type}</TableCell>
                  <TableCell>{issue.storyPoints ?? "-"}</TableCell>
                  <TableCell>
                    {issue.dueDate ? format(new Date(issue.dueDate), "yyyy-MM-dd") : "-"}
                  </TableCell>
                  <TableCell>{format(new Date(issue.updatedAt), "yyyy-MM-dd HH:mm")}</TableCell>
                  <TableCell>{issue.assignee?.name ?? "Unassigned"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            backwardText="Previous page"
            className="flowboard-pagination"
            forwardText="Next page"
            itemsPerPageText="Rows per page:"
            onChange={({ page: nextPage, pageSize: nextPageSize }) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }}
            page={issues.meta.page}
            pageNumberText="Page Number"
            pageSize={issues.meta.pageSize}
            pageSizes={[10, 20, 50]}
            totalItems={issues.meta.total}
          />
        </TableContainer>
      </Tile>

      <ComposedModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
        }}
      >
        <ModalHeader label="Issue" title="Create issue" />
        <ModalBody className="flowboard-modal-body">
          <TextInput
            id="new-issue-title"
            labelText="Title"
            onChange={(event) => {
              setNewIssueTitle(event.target.value);
            }}
            value={newIssueTitle}
          />
          <Dropdown
            id="new-issue-board"
            itemToString={(item) => item?.label ?? ""}
            items={boardOptions}
            label="Board"
            onChange={({ selectedItem }) => {
              setNewIssueBoardId(selectedItem?.id ?? "");
              setNewIssueColumnId(null);
            }}
            selectedItem={boardOptions.find((item) => item.id === newIssueBoardId) ?? null}
            titleText="Board"
          />
          <Dropdown
            disabled
            id="new-issue-column"
            itemToString={(item) => item?.label ?? ""}
            items={columnOptions}
            label="Column"
            onChange={({ selectedItem }) => {
              setNewIssueColumnId(selectedItem?.id ?? null);
            }}
            selectedItem={columnOptions[0] ?? null}
            titleText="Column"
          />
          <Dropdown
            id="new-issue-priority"
            itemToString={(item) => item?.label ?? ""}
            items={createPriorityOptions}
            label="Priority"
            onChange={({ selectedItem }) => {
              setNewIssuePriority((selectedItem as SelectOption<IssuePriority> | null)?.id ?? "medium");
            }}
            selectedItem={{
              id: newIssuePriority,
              label: createPriorityOptions.find((item) => item.id === newIssuePriority)?.label ?? "Medium",
            }}
            titleText="Priority"
          />
          <Dropdown
            id="new-issue-type"
            itemToString={(item) => item?.label ?? ""}
            items={createTypeOptions}
            label="Type"
            onChange={({ selectedItem }) => {
              setNewIssueType((selectedItem as SelectOption<IssueType> | null)?.id ?? "task");
            }}
            selectedItem={{
              id: newIssueType,
              label: createTypeOptions.find((item) => item.id === newIssueType)?.label ?? "Task",
            }}
            titleText="Type"
          />
        </ModalBody>
        <ModalFooter
          primaryButtonText={createIssueMutation.isPending ? "Creating" : "Create"}
          secondaryButtonText="Cancel"
          onRequestClose={() => {
            setCreateModalOpen(false);
          }}
          onRequestSubmit={async () => {
            if (!newIssueTitle.trim() || !newIssueBoardId) {
              return;
            }

            await createIssueMutation.mutateAsync({
              boardId: newIssueBoardId,
              columnId: newIssueColumnId,
              labelIds: [],
              priority: newIssuePriority,
              status: "todo",
              title: newIssueTitle.trim(),
              type: newIssueType,
            });
            setCreateModalOpen(false);
            setNewIssueTitle("");
          }}
        >
          {null}
        </ModalFooter>
      </ComposedModal>
    </PageLayout>
  );
}
