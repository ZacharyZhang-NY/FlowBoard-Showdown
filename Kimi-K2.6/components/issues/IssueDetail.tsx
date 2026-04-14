"use client";

import { useState, useEffect } from "react";
import {
  TextInput,
  TextArea,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Dropdown,
  NumberInput,
  DatePicker,
  DatePickerInput,
  MultiSelect,
  Loading,
  Tag,
  Button,
} from "@carbon/react";
import { useIssue, useUpdateIssue, useComments, useCreateComment, useActivity, useUpdateIssueLabels } from "@/hooks/use-issues";
import { useSprints } from "@/hooks/use-sprints";
import { useProjects } from "@/hooks/use-projects";
import { useLabels } from "@/hooks/use-labels";
import { useUsers } from "@/hooks/use-users";
import { CommentList } from "./CommentList";
import { ActivityFeed } from "./ActivityFeed";

const statuses = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
  { id: "blocked", label: "Blocked" },
];

const priorities = [
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

const types = [
  { id: "task", label: "Task" },
  { id: "bug", label: "Bug" },
  { id: "feature", label: "Feature" },
  { id: "improvement", label: "Improvement" },
];

function useIsBelowMd() {
  const [isBelow, setIsBelow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 672px)");
    const update = () => setIsBelow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isBelow;
}

export function IssueDetail({ issueId }: { issueId: string }) {
  const { data: issue, isLoading } = useIssue(issueId);
  const updateIssue = useUpdateIssue();
  const { data: comments } = useComments(issueId);
  const { data: activity } = useActivity(issueId);
  const { data: projects } = useProjects();
  const projectId = projects?.[0]?.id;
  const { data: sprints } = useSprints(projectId || "");
  const { data: labels } = useLabels(projectId || "");
  const { data: users } = useUsers();
  const [commentText, setCommentText] = useState("");
  const createComment = useCreateComment();
  const updateIssueLabels = useUpdateIssueLabels();
  const isBelowMd = useIsBelowMd();

  if (isLoading || !issue) return <Loading />;

  const handleChange = (field: string, value: unknown) => {
    updateIssue.mutate({ id: issueId, data: { [field]: value } });
  };

  const statusItem = statuses.find((s) => s.id === issue.status);
  const priorityItem = priorities.find((p) => p.id === issue.priority);
  const typeItem = types.find((t) => t.id === issue.type);
  const assigneeItem = issue.assigneeId
    ? { id: issue.assigneeId, label: issue.assignee?.name || "Unknown" }
    : { id: "", label: "Unassigned" };

  const projectKey = projects?.find((p) => p.id === issue.projectId)?.key || "FB";

  return (
    <div style={{ display: "grid", gridTemplateColumns: isBelowMd ? "1fr" : "10fr 6fr", gap: "2rem" }}>
      <div>
        <div style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
          {projectKey}-{issue.number}
        </div>
        <TextInput
          id="issue-title"
          labelText="Title"
          value={issue.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("title", e.target.value)}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleChange("title", e.target.value)}
          style={{ marginBottom: "1rem" }}
        />
        <TextArea
          id="issue-desc"
          labelText="Description"
          value={issue.description || ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("description", e.target.value)}
          onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => handleChange("description", e.target.value)}
          style={{ marginBottom: "1.5rem", minHeight: 120 }}
        />

        <Tabs>
          <TabList aria-label="Issue tabs">
            <Tab>Comments</Tab>
            <Tab>Activity</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div style={{ marginTop: "1rem" }}>
                <TextArea
                  id="new-comment"
                  labelText="Add a comment"
                  value={commentText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentText(e.target.value)}
                  style={{ marginBottom: "0.5rem" }}
                />
                <Button
                  onClick={() => {
                    if (!commentText.trim()) return;
                    createComment.mutate({ issueId, content: commentText }, {
                      onSuccess: () => setCommentText(""),
                    });
                  }}
                >
                  Post Comment
                </Button>
                <div style={{ marginTop: "1rem" }}>
                  <CommentList comments={comments || []} />
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <div style={{ marginTop: "1rem" }}>
                <ActivityFeed activity={activity || []} />
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>

      <div>
        <Field label="Status">
          <Dropdown
            id="issue-status"
            titleText=""
            label="Select status"
            items={statuses}
            selectedItem={statusItem}
            itemToString={(item) => item?.label || ""}
            onChange={({ selectedItem }) => selectedItem && handleChange("status", selectedItem.id)}
          />
        </Field>
        <Field label="Priority">
          <Dropdown
            id="issue-priority"
            titleText=""
            label="Select priority"
            items={priorities}
            selectedItem={priorityItem}
            itemToString={(item) => item?.label || ""}
            onChange={({ selectedItem }) => selectedItem && handleChange("priority", selectedItem.id)}
          />
        </Field>
        <Field label="Type">
          <Dropdown
            id="issue-type"
            titleText=""
            label="Select type"
            items={types}
            selectedItem={typeItem}
            itemToString={(item) => item?.label || ""}
            onChange={({ selectedItem }) => selectedItem && handleChange("type", selectedItem.id)}
          />
        </Field>
        <Field label="Assignee">
          <Dropdown
            id="issue-assignee"
            titleText=""
            label="Select assignee"
            items={[{ id: "", label: "Unassigned" }, ...(users || []).map((u) => ({ id: u.id, label: u.name }))]}
            selectedItem={assigneeItem}
            itemToString={(item) => item?.label || ""}
            onChange={({ selectedItem }) => handleChange("assigneeId", selectedItem?.id || null)}
          />
        </Field>
        <Field label="Sprint">
          <Dropdown
            id="issue-sprint"
            titleText=""
            label="Select sprint"
            items={[{ id: "", label: "None" }, ...(sprints || []).map((s) => ({ id: s.id, label: s.name }))]}
            selectedItem={{ id: issue.sprintId || "", label: issue.sprint?.name || "None" }}
            itemToString={(item) => item?.label || ""}
            onChange={({ selectedItem }) => handleChange("sprintId", selectedItem?.id || null)}
          />
        </Field>
        <Field label="Story Points">
          <NumberInput
            id="issue-points"
            label=""
            hideLabel
            value={issue.storyPoints ?? 0}
            onChange={(_event, { value }) => handleChange("storyPoints", value)}
          />
        </Field>
        <Field label="Due Date">
          <DatePicker
            datePickerType="single"
            value={issue.dueDate ? new Date(issue.dueDate).toISOString().split("T")[0] : ""}
            onChange={(dates: Date[]) => dates[0] && handleChange("dueDate", dates[0].toISOString())}
          >
            <DatePickerInput id="issue-due" labelText="" placeholder="mm/dd/yyyy" />
          </DatePicker>
        </Field>
        <Field label="Labels">
          <MultiSelect
            id="issue-labels"
            titleText=""
            label="Select labels"
            items={(labels || []).map((l) => ({ id: l.id, label: l.name, text: l.name }))}
            initialSelectedItems={(labels || []).filter((l) => issue.labels?.some((il) => il.id === l.id)).map((l) => ({ id: l.id, label: l.name, text: l.name }))}
            itemToString={(item) => item?.text || ""}
            onChange={({ selectedItems }) => {
              updateIssueLabels.mutate({ id: issueId, labelIds: (selectedItems || []).map((i: any) => i.id) });
            }}
          />
        </Field>
        <Field label="Created">
          <div>{new Date(issue.createdAt).toLocaleString()}</div>
        </Field>
        <Field label="Updated">
          <div>{new Date(issue.updatedAt).toLocaleString()}</div>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--cds-text-secondary)" }}>{label}</div>
      {children}
    </div>
  );
}
