"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  TableSelectRow,
  TableSelectAll,
  Button,
  Pagination,
  Tag,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  Dropdown,
} from "@carbon/react";
import type { Issue, Sprint, IssueStatus, IssuePriority, IssueType } from "@/types";
import { useCreateIssue } from "@/hooks/use-board";
import { useBulkUpdateIssues } from "@/hooks/use-issues";

interface IssueTableProps {
  issues: Issue[];
  projectKey: string;
  sprints: Sprint[];
  users: { id: string; name: string | null }[];
  projectId: string;
}

const statusTag: Record<IssueStatus, string> = {
  todo: "gray",
  in_progress: "blue",
  in_review: "purple",
  done: "green",
  blocked: "red",
};

const priorityTag: Record<IssuePriority, string> = {
  critical: "red",
  high: "warm-gray",
  medium: "blue",
  low: "gray",
};

export function IssueTable({ issues, projectKey, sprints, users, projectId }: IssueTableProps) {
  const router = useRouter();
  const createIssue = useCreateIssue();
  const bulkUpdate = useBulkUpdateIssues();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterSprint, setFilterSprint] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchAction, setBatchAction] = useState<"status" | "assign" | "sprint" | null>(null);
  const [batchValue, setBatchValue] = useState<string>("");

  const filtered = useMemo(() => {
    return issues.filter((i) => {
      const matchesSearch =
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        `${projectKey}-${i.number}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !filterStatus || i.status === filterStatus;
      const matchesPriority = !filterPriority || i.priority === filterPriority;
      const matchesType = !filterType || i.type === filterType;
      const matchesSprint =
        filterSprint === null ||
        (filterSprint === "none" ? !i.sprintId : i.sprintId === filterSprint);
      const matchesAssignee =
        filterAssignee === null ||
        (filterAssignee === "none" ? !i.assigneeId : i.assigneeId === filterAssignee);
      return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesSprint && matchesAssignee;
    });
  }, [issues, search, projectKey, filterStatus, filterPriority, filterType, filterSprint, filterAssignee]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const headers = [
    { key: "select", header: "" },
    { key: "key", header: "Key" },
    { key: "title", header: "Title" },
    { key: "status", header: "Status" },
    { key: "priority", header: "Priority" },
    { key: "type", header: "Type" },
    { key: "assignee", header: "Assignee" },
    { key: "sprint", header: "Sprint" },
    { key: "storyPoints", header: "Points" },
    { key: "dueDate", header: "Due Date" },
    { key: "updatedAt", header: "Updated" },
  ];

  const rows = paginated.map((issue) => ({
    id: issue.id,
    key: `${projectKey}-${issue.number}`,
    title: issue.title,
    status: (
      <Tag type={statusTag[issue.status as IssueStatus] as any} size="sm">
        {issue.status.replace("_", " ")}
      </Tag>
    ),
    priority: (
      <Tag type={priorityTag[issue.priority as IssuePriority] as any} size="sm">
        {issue.priority}
      </Tag>
    ),
    type: issue.type,
    assignee: issue.assignee?.name || "Unassigned",
    sprint: issue.sprint?.name || "-",
    storyPoints: issue.storyPoints ?? "-",
    dueDate: issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : "-",
    updatedAt: new Date(issue.updatedAt).toLocaleDateString(),
  }));

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createIssue.mutate({ projectId, data: { title: newTitle.trim() } }, {
      onSuccess: () => {
        setNewTitle("");
        setIsModalOpen(false);
        router.refresh();
      },
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pageIds = paginated.map((i) => i.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const applyBatch = () => {
    if (selectedIds.length === 0 || !batchAction || !batchValue) return;
    const data: Record<string, unknown> =
      batchAction === "status"
        ? { status: batchValue }
        : batchAction === "assign"
        ? { assigneeId: batchValue === "none" ? null : batchValue }
        : { sprintId: batchValue === "none" ? null : batchValue };
    bulkUpdate.mutate({ ids: selectedIds, data }, {
      onSuccess: () => {
        setBatchAction(null);
        setBatchValue("");
        setSelectedIds([]);
        router.refresh();
      },
    });
  };

  const batchOptions = useMemo(() => {
    if (batchAction === "status") {
      return [
        { id: "todo", label: "To Do" },
        { id: "in_progress", label: "In Progress" },
        { id: "in_review", label: "In Review" },
        { id: "done", label: "Done" },
        { id: "blocked", label: "Blocked" },
      ];
    }
    if (batchAction === "assign") {
      return [{ id: "none", label: "Unassigned" }, ...users.map((u) => ({ id: u.id, label: u.name || "Unknown" }))];
    }
    if (batchAction === "sprint") {
      return [{ id: "none", label: "Backlog" }, ...sprints.map((s) => ({ id: s.id, label: s.name }))];
    }
    return [];
  }, [batchAction, users, sprints]);

  return (
    <>
      <DataTable rows={rows} headers={headers}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getSelectionProps }) => (
          <TableContainer>
            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch
                  persistent
                  value={search}
                  onChange={(_event, value) => {
                    setSearch(value || "");
                    setPage(1);
                  }}
                />
                <Dropdown
                  id="filter-status"
                  titleText=""
                  label="Status"
                  size="sm"
                  items={[
                    { id: "", label: "All" },
                    { id: "todo", label: "To Do" },
                    { id: "in_progress", label: "In Progress" },
                    { id: "in_review", label: "In Review" },
                    { id: "done", label: "Done" },
                    { id: "blocked", label: "Blocked" },
                  ]}
                  selectedItem={filterStatus ? { id: filterStatus, label: filterStatus.replace("_", " ") } : { id: "", label: "All" }}
                  itemToString={(item) => item?.label || ""}
                  onChange={({ selectedItem }) => setFilterStatus(selectedItem?.id || null)}
                  style={{ minWidth: 120 }}
                />
                <Dropdown
                  id="filter-priority"
                  titleText=""
                  label="Priority"
                  size="sm"
                  items={[
                    { id: "", label: "All" },
                    { id: "critical", label: "Critical" },
                    { id: "high", label: "High" },
                    { id: "medium", label: "Medium" },
                    { id: "low", label: "Low" },
                  ]}
                  selectedItem={filterPriority ? { id: filterPriority, label: filterPriority } : { id: "", label: "All" }}
                  itemToString={(item) => item?.label || ""}
                  onChange={({ selectedItem }) => setFilterPriority(selectedItem?.id || null)}
                  style={{ minWidth: 120 }}
                />
                <Dropdown
                  id="filter-type"
                  titleText=""
                  label="Type"
                  size="sm"
                  items={[
                    { id: "", label: "All" },
                    { id: "task", label: "Task" },
                    { id: "bug", label: "Bug" },
                    { id: "feature", label: "Feature" },
                    { id: "improvement", label: "Improvement" },
                  ]}
                  selectedItem={filterType ? { id: filterType, label: filterType } : { id: "", label: "All" }}
                  itemToString={(item) => item?.label || ""}
                  onChange={({ selectedItem }) => setFilterType(selectedItem?.id || null)}
                  style={{ minWidth: 120 }}
                />
                <Dropdown
                  id="filter-sprint"
                  titleText=""
                  label="Sprint"
                  size="sm"
                  items={[{ id: "", label: "All" }, { id: "none", label: "Backlog" }, ...sprints.map((s) => ({ id: s.id, label: s.name }))]}
                  selectedItem={
                    filterSprint === null
                      ? { id: "", label: "All" }
                      : filterSprint === "none"
                      ? { id: "none", label: "Backlog" }
                      : { id: filterSprint, label: sprints.find((s) => s.id === filterSprint)?.name || "All" }
                  }
                  itemToString={(item) => item?.label || ""}
                  onChange={({ selectedItem }) => setFilterSprint(selectedItem?.id === "" ? null : selectedItem?.id || null)}
                  style={{ minWidth: 140 }}
                />
                <Dropdown
                  id="filter-assignee"
                  titleText=""
                  label="Assignee"
                  size="sm"
                  items={[{ id: "", label: "All" }, { id: "none", label: "Unassigned" }, ...users.map((u) => ({ id: u.id, label: u.name || "Unknown" }))]}
                  selectedItem={
                    filterAssignee === null
                      ? { id: "", label: "All" }
                      : filterAssignee === "none"
                      ? { id: "none", label: "Unassigned" }
                      : { id: filterAssignee, label: users.find((u) => u.id === filterAssignee)?.name || "All" }
                  }
                  itemToString={(item) => item?.label || ""}
                  onChange={({ selectedItem }) => setFilterAssignee(selectedItem?.id === "" ? null : selectedItem?.id || null)}
                  style={{ minWidth: 140 }}
                />
                <Button onClick={() => setIsModalOpen(true)}>New Issue</Button>
              </TableToolbarContent>
            </TableToolbar>

            {selectedIds.length > 0 && (
              <div style={{ padding: "0.5rem 1rem", background: "var(--cds-layer-hover)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem" }}>{selectedIds.length} selected</span>
                <Button kind="secondary" size="sm" onClick={() => setBatchAction("status")}>Change Status</Button>
                <Button kind="secondary" size="sm" onClick={() => setBatchAction("assign")}>Assign</Button>
                <Button kind="secondary" size="sm" onClick={() => setBatchAction("sprint")}>Move to Sprint</Button>
                <Button kind="ghost" size="sm" onClick={() => setSelectedIds([])}>Clear</Button>
              </div>
            )}

            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  <TableSelectAll
                    {...getSelectionProps()}
                    checked={paginated.length > 0 && paginated.every((i) => selectedIds.includes(i.id))}
                    indeterminate={paginated.some((i) => selectedIds.includes(i.id)) && !paginated.every((i) => selectedIds.includes(i.id))}
                    onSelect={toggleSelectAll}
                    ariaLabel="Select all rows"
                  />
                  {headers.filter((h) => h.key !== "select").map((header) => (
                    <TableHeader {...getHeaderProps({ header })} key={header.key}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow
                    {...getRowProps({ row })}
                    key={row.id}
                    onClick={() => router.push(`/issues/${row.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableSelectRow
                      {...getSelectionProps()}
                      checked={selectedIds.includes(row.id)}
                      onSelect={(e: React.MouseEvent | undefined) => {
                        e?.stopPropagation();
                        toggleSelect(row.id);
                      }}
                      ariaLabel={`Select row ${row.cells.find((c) => c.info.header === "key")?.value || ""}`}
                    />
                    {row.cells.filter((c) => c.info.header !== "select").map((cell) => (
                      <TableCell key={cell.id}>{cell.value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      <Pagination
        page={page}
        pageSize={pageSize}
        pageSizes={[10, 20, 50]}
        totalItems={filtered.length}
        onChange={({ page, pageSize }) => {
          setPage(page);
          setPageSize(pageSize);
        }}
      />

      <ComposedModal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader title="Create Issue" />
        <ModalBody>
          <TextInput
            id="new-issue-title"
            labelText="Title"
            value={newTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </ModalFooter>
      </ComposedModal>

      <ComposedModal open={!!batchAction} onClose={() => { setBatchAction(null); setBatchValue(""); }}>
        <ModalHeader title={batchAction === "status" ? "Bulk Change Status" : batchAction === "assign" ? "Bulk Assign" : "Bulk Move to Sprint"} />
        <ModalBody>
          <Dropdown
            id="batch-value"
            titleText=""
            label="Select value"
            items={batchOptions}
            selectedItem={batchOptions.find((o) => o.id === batchValue) || null}
            itemToString={(item) => item?.label || ""}
            onChange={({ selectedItem }) => setBatchValue(selectedItem?.id || "")}
          />
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={() => { setBatchAction(null); setBatchValue(""); }}>Cancel</Button>
          <Button onClick={applyBatch} disabled={!batchValue}>Apply</Button>
        </ModalFooter>
      </ComposedModal>
    </>
  );
}
