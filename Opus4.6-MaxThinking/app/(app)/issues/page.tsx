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
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Tag,
  Button,
  Dropdown,
  Pagination,
  Loading,
} from "@carbon/react";
import { Add } from "@carbon/icons-react";
import { useIssues } from "@/hooks/use-issues";
import { useProjects } from "@/hooks/use-projects";
import {
  STATUS_TAG_KIND,
  PRIORITY_TAG_KIND,
  STATUS_LABELS,
  PRIORITY_LABELS,
  TYPE_LABELS,
  ISSUE_STATUSES,
  ISSUE_PRIORITIES,
} from "@/types";
import { formatDate } from "@/lib/utils";
import IssueFormModal from "@/components/issues/IssueFormModal";

const HEADERS = [
  { key: "key", header: "Key" },
  { key: "title", header: "Title" },
  { key: "status", header: "Status" },
  { key: "priority", header: "Priority" },
  { key: "type", header: "Type" },
  { key: "assignee", header: "Assignee" },
  { key: "storyPoints", header: "Points" },
  { key: "updatedAt", header: "Updated" },
];

export default function IssuesPage() {
  const router = useRouter();
  const { projects, loading: projectsLoading } = useProjects();
  const projectId = projects[0]?.id || null;
  const projectKey = projects[0]?.key || "FB";

  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filters = useMemo(
    () => ({
      status: statusFilter,
      priority: priorityFilter,
      search: search || undefined,
      page,
      limit: pageSize,
    }),
    [statusFilter, priorityFilter, search, page, pageSize]
  );

  const { issues, total, loading, refetch } = useIssues(projectId, filters);

  const rows = issues.map((issue) => ({
    id: issue.id,
    key: `${projectKey}-${issue.number}`,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    type: issue.type,
    assignee: issue.assignee?.name || "Unassigned",
    storyPoints: issue.storyPoints ?? "—",
    updatedAt: formatDate(issue.updatedAt),
  }));

  if (projectsLoading) {
    return <Loading withOverlay={false} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Issues</h1>
        <Button renderIcon={Add} onClick={() => setShowCreateModal(true)}>
          New Issue
        </Button>
      </div>

      <div className="flex-row mb-2" style={{ gap: "1rem", flexWrap: "wrap" }}>
        <Dropdown
          id="status-filter"
          titleText=""
          label="Status"
          size="sm"
          items={[{ id: "", text: "All Statuses" }, ...ISSUE_STATUSES.map((s) => ({ id: s, text: STATUS_LABELS[s] }))]}
          itemToString={(item: { id: string; text: string } | null) => item?.text || ""}
          onChange={({ selectedItem }: { selectedItem: { id: string; text: string } | null }) =>
            setStatusFilter(selectedItem?.id || undefined)
          }
        />
        <Dropdown
          id="priority-filter"
          titleText=""
          label="Priority"
          size="sm"
          items={[{ id: "", text: "All Priorities" }, ...ISSUE_PRIORITIES.map((p) => ({ id: p, text: PRIORITY_LABELS[p] }))]}
          itemToString={(item: { id: string; text: string } | null) => item?.text || ""}
          onChange={({ selectedItem }: { selectedItem: { id: string; text: string } | null }) =>
            setPriorityFilter(selectedItem?.id || undefined)
          }
        />
      </div>

      <DataTable rows={rows} headers={HEADERS} isSortable>
        {({
          rows: tableRows,
          headers: tableHeaders,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getToolbarProps,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }: any) => (
          <>
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch
                  onChange={(_e: unknown, value?: string) =>
                    setSearch(value || "")
                  }
                  placeholder="Search issues..."
                />
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header: { key: string; header: React.ReactNode }) => (
                    <TableHeader
                      key={header.key}
                      {...getHeaderProps({ header })}
                    >
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row: { id: string; cells: { id: string; value: string; info: { header: string } }[] }) => (
                  <TableRow
                    key={row.id}
                    {...getRowProps({ row })}
                    onClick={() => router.push(`/issues/${row.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {row.cells.map((cell: { id: string; value: string; info: { header: string } }) => (
                      <TableCell key={cell.id}>
                        {cell.info.header === "status" ? (
                          <Tag
                            size="sm"
                            type={
                              STATUS_TAG_KIND[
                                cell.value as keyof typeof STATUS_TAG_KIND
                              ] || "gray"
                            }
                          >
                            {STATUS_LABELS[
                              cell.value as keyof typeof STATUS_LABELS
                            ] || cell.value}
                          </Tag>
                        ) : cell.info.header === "priority" ? (
                          <Tag
                            size="sm"
                            type={
                              PRIORITY_TAG_KIND[
                                cell.value as keyof typeof PRIORITY_TAG_KIND
                              ] || "gray"
                            }
                          >
                            {PRIORITY_LABELS[
                              cell.value as keyof typeof PRIORITY_LABELS
                            ] || cell.value}
                          </Tag>
                        ) : cell.info.header === "type" ? (
                          TYPE_LABELS[
                            cell.value as keyof typeof TYPE_LABELS
                          ] || cell.value
                        ) : (
                          cell.value
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </DataTable>

      <Pagination
        totalItems={total}
        pageSize={pageSize}
        pageSizes={[10, 20, 50]}
        page={page}
        onChange={({
          page: newPage,
          pageSize: newPageSize,
        }: {
          page: number;
          pageSize: number;
        }) => {
          setPage(newPage);
          setPageSize(newPageSize);
        }}
      />

      {showCreateModal && projectId && (
        <IssueFormModal
          projectId={projectId}
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
