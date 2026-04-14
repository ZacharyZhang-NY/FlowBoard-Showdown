"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { TextInput, TextArea, Dropdown, Tag, Button, Tabs, TabList, Tab, TabPanels, TabPanel, NumberInput, ComposedModal, ModalHeader, ModalBody, ModalFooter } from "@carbon/react";
import { getStatusTagKind, getStatusLabel, getPriorityTagKind, getPriorityLabel, getTypeLabel, formatDate, formatRelativeTime } from "@/lib/utils";

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.id as string;
  const [issue, setIssue] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/issues/${issueId}`);
    const json = await res.json();
    setIssue(json.data);
    const [cRes, aRes] = await Promise.all([fetch(`/api/v1/issues/${issueId}/comments`), fetch(`/api/v1/issues/${issueId}/activity`)]);
    setComments((await cRes.json()).data || []);
    setActivity((await aRes.json()).data || []);
  }, [issueId]);

  useEffect(() => { load(); }, [load]);

  const update = async (field: string, value: any) => {
    await fetch(`/api/v1/issues/${issueId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    load();
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    await fetch(`/api/v1/issues/${issueId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newComment }) });
    setNewComment("");
    load();
  };

  if (!issue) return <div style={{ padding: 32 }}>Loading...</div>;

  const statuses = ["todo", "in_progress", "in_review", "done", "blocked"];
  const priorities = ["critical", "high", "medium", "low"];
  const types = ["task", "bug", "feature", "improvement"];

  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <Tag kind={getStatusTagKind(issue.status) as "gray" | "blue" | "purple" | "green" | "red"}>{getStatusLabel(issue.status)}</Tag>
            <span style={{ marginLeft: 8, color: "var(--cds-text-secondary)" }}>FB-{issue.number}</span>
          </div>
          <TextInput id="title" labelText="Title" value={issue.title} onBlur={(e: React.FocusEvent<HTMLInputElement>) => update("title", e.target.value)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIssue({ ...issue, title: e.target.value })} />
          <div style={{ marginTop: 16 }}>
            <TextArea id="desc" labelText="Description" value={issue.description || ""} rows={6} onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => update("description", e.target.value)} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIssue({ ...issue, description: e.target.value })} />
          </div>

          <Tabs style={{ marginTop: 24 }}>
            <TabList aria-label="Issue sections">
              <Tab>Comments ({comments.length})</Tab>
              <Tab>Activity</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                {comments.map((c: any) => (
                  <div key={c.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--cds-border-subtle)" }}>
                    <div style={{ fontSize: 12, color: "var(--cds-text-secondary)", marginBottom: 4 }}>{c.author?.name} · {formatRelativeTime(c.createdAt)}</div>
                    <p style={{ fontSize: 14 }}>{c.content}</p>
                  </div>
                ))}
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <TextArea id="new-comment" rows={2} value={newComment} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)} placeholder="Add a comment..." />
                  <Button onClick={addComment} disabled={!newComment.trim()}>Comment</Button>
                </div>
              </TabPanel>
              <TabPanel>
                {activity.map((a: any) => (
                  <div key={a.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--cds-border-subtle)", fontSize: 14 }}>
                    <strong>{a.user?.name}</strong> {a.action} {a.oldValue ? `"${a.oldValue}" → ` : ""}{a.newValue ? `"${a.newValue}"` : ""} <span style={{ color: "var(--cds-text-secondary)" }}>· {formatRelativeTime(a.createdAt)}</span>
                  </div>
                ))}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Dropdown id="status" titleText="Status" items={statuses} selectedItem={issue.status} onChange={(e: any) => update("status", e.selectedItem)} itemToString={(s: string) => getStatusLabel(s)} />
          <Dropdown id="priority" titleText="Priority" items={priorities} selectedItem={issue.priority} onChange={(e: any) => update("priority", e.selectedItem)} itemToString={(p: string) => getPriorityLabel(p)} />
          <Dropdown id="type" titleText="Type" items={types} selectedItem={issue.type} onChange={(e: any) => update("type", e.selectedItem)} itemToString={(t: string) => getTypeLabel(t)} />
          <NumberInput id="storyPoints" label="Story Points" min={0} max={100} value={issue.storyPoints ?? 0} onChange={(_e: any, { value }: any) => update("storyPoints", value)} />
          <div><span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>Created: {formatDate(issue.createdAt)}</span></div>
          <div><span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>Updated: {formatDate(issue.updatedAt)}</span></div>
          <Button kind="danger" onClick={async () => { await fetch(`/api/v1/issues/${issueId}`, { method: "DELETE" }); router.push("/issues"); }}>Delete Issue</Button>
        </div>
      </div>
    </div>
  );
}
