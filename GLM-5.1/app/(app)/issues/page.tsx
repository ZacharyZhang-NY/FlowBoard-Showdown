"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch, Button, Tag, Pagination, ComposedModal, ModalHeader, ModalBody, ModalFooter, TextInput, Dropdown, NumberInput } from "@carbon/react";
import { getStatusTagKind, getStatusLabel, getPriorityTagKind, getPriorityLabel, getTypeLabel } from "@/lib/utils";

interface Issue { id: string; number: number; title: string; status: string; priority: string; type: string; storyPoints: number | null; updatedAt: string }

const headers = [
  { key: "key", header: "Key" },
  { key: "title", header: "Title" },
  { key: "status", header: "Status" },
  { key: "priority", header: "Priority" },
  { key: "type", header: "Type" },
  { key: "storyPoints", header: "Points" },
];

export default function IssuesPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projectKey, setProjectKey] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [first, setFirst] = useState(0);
  const pageSize = 20;

  const load = useCallback(async () => {
    const projRes = await fetch("/api/v1/projects");
    const projJson = await projRes.json();
    const proj = projJson.data?.[0];
    if (!proj) return;
    setProjectKey(proj.key);
    const res = await fetch(`/api/v1/projects/${proj.id}/issues`);
    const json = await res.json();
    setIssues(json.data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = issues.slice(first, first + pageSize).map((i) => ({
    id: i.id,
    key: `${projectKey}-${i.number}`,
    title: i.title,
    status: i.status,
    priority: i.priority,
    type: i.type,
    storyPoints: i.storyPoints ?? "—",
  }));

  const createIssue = async () => {
    const projRes = await fetch("/api/v1/projects");
    const proj = (await projRes.json()).data?.[0];
    if (!proj || !newTitle) return;
    await fetch(`/api/v1/projects/${proj.id}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    setNewTitle("");
    setModalOpen(false);
    load();
  };

  return (
    <div style={{ padding: "32px 0" }}>
      <h2 style={{ marginBottom: 24, fontWeight: 400 }}>Issues</h2>
      <DataTable rows={rows} headers={headers}>
        {({ rows: r, headers: h, getTableProps, getHeaderProps, getRowProps, getToolbarProps }) => (
          <Table {...getTableProps()}>
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch />
                <Button onClick={() => setModalOpen(true)}>New Issue</Button>
              </TableToolbarContent>
            </TableToolbar>
            <TableHead><TableRow>{h.map((header) => <TableHeader key={header.key} {...getHeaderProps({ header })}>{header.header}</TableHeader>)}</TableRow></TableHead>
            <TableBody>
              {r.map((row) => (
                <TableRow key={row.id} {...getRowProps({ row })} onClick={() => router.push(`/issues/${row.id}`)} style={{ cursor: "pointer" }}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>
                      {cell.info.header === "status" ? <Tag kind={getStatusTagKind(cell.value) as "gray" | "blue" | "purple" | "green" | "red"} size="sm">{getStatusLabel(cell.value)}</Tag> :
                       cell.info.header === "priority" ? <Tag kind={getPriorityTagKind(cell.value) as "gray" | "blue" | "red" | "warm-gray"} size="sm">{getPriorityLabel(cell.value)}</Tag> :
                       cell.value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTable>
      {issues.length > pageSize && <Pagination totalItems={issues.length} pageSize={pageSize} page={Math.floor(first / pageSize) + 1} onChange={({ page }: { page: number }) => setFirst((page - 1) * pageSize)} />}

      <ComposedModal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader title="New Issue" />
        <ModalBody><TextInput id="new-issue-title" labelText="Title" value={newTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)} /></ModalBody>
        <ModalFooter primaryButtonText="Create" onRequestSubmit={createIssue} />
      </ComposedModal>
    </div>
  );
}
