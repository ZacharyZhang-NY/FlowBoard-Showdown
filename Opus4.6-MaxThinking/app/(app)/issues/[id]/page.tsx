"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  TextInput,
  TextArea,
  Dropdown,
  NumberInput,
  Tag,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  Loading,
  StructuredListWrapper,
  StructuredListBody,
  StructuredListRow,
  StructuredListCell,
  Stack,
} from "@carbon/react";
import { useIssueDetail } from "@/hooks/use-issues";
import {
  ISSUE_STATUSES,
  ISSUE_PRIORITIES,
  ISSUE_TYPES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  TYPE_LABELS,
  STATUS_TAG_KIND,
} from "@/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import UserAvatarComponent from "@/components/shared/UserAvatar";

type CommentWithAuthor = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; email: string; image: string | null };
};

type ActivityWithUser = {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: string; name: string };
};

export default function IssueDetailPage() {
  const params = useParams();
  const issueId = params.id as string;
  const { issue, loading, updateIssue, refetch } = useIssueDetail(issueId);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [activity, setActivity] = useState<ActivityWithUser[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const loadCommentsAndActivity = useCallback(async () => {
    if (!issueId) return;
    const [commentsRes, activityRes] = await Promise.all([
      fetch(`/api/v1/issues/${issueId}/comments`),
      fetch(`/api/v1/issues/${issueId}/activity`),
    ]);
    const commentsJson = await commentsRes.json();
    const activityJson = await activityRes.json();
    if (commentsJson.data) setComments(commentsJson.data);
    if (activityJson.data) setActivity(activityJson.data);
  }, [issueId]);

  useEffect(() => {
    loadCommentsAndActivity();
  }, [loadCommentsAndActivity]);

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setCommentSubmitting(true);
    try {
      await fetch(`/api/v1/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      setNewComment("");
      loadCommentsAndActivity();
    } finally {
      setCommentSubmitting(false);
    }
  }

  if (loading || !issue) {
    return <Loading withOverlay={false} />;
  }

  const projectKey = issue.project?.key || "FB";

  return (
    <div>
      <Breadcrumb noTrailingSlash style={{ marginBottom: "1rem" }}>
        <BreadcrumbItem href="/issues">Issues</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          {projectKey}-{issue.number}
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="issue-detail">
        <div className="issue-detail-main">
          <TextInput
            id="issue-title"
            labelText=""
            hideLabel
            value={issue.title}
            size="lg"
            onBlur={(e) => {
              const val = (e.target as HTMLInputElement).value;
              if (val !== issue.title) updateIssue({ title: val });
            }}
            onChange={() => {}}
          />

          <TextArea
            id="issue-description"
            labelText="Description"
            value={issue.description || ""}
            placeholder="Add a description..."
            onBlur={(e) => {
              const val = (e.target as HTMLTextAreaElement).value;
              if (val !== (issue.description || "")) {
                updateIssue({ description: val || null });
              }
            }}
            onChange={() => {}}
          />

          <Tabs>
            <TabList aria-label="Issue tabs">
              <Tab>Comments ({comments.length})</Tab>
              <Tab>Activity ({activity.length})</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Stack gap={4}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <TextArea
                      id="new-comment"
                      labelText=""
                      hideLabel
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      style={{ flex: 1 }}
                    />
                    <Button
                      size="md"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || commentSubmitting}
                    >
                      Send
                    </Button>
                  </div>
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        padding: "0.75rem",
                        background: "var(--cds-layer)",
                        borderRadius: "4px",
                      }}
                    >
                      <div className="flex-row mb-1">
                        <UserAvatarComponent
                          name={comment.author.name}
                          size="small"
                        />
                        <strong>{comment.author.name}</strong>
                        <span
                          style={{
                            color: "var(--cds-text-secondary)",
                            fontSize: "0.75rem",
                          }}
                        >
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p>{comment.content}</p>
                    </div>
                  ))}
                </Stack>
              </TabPanel>
              <TabPanel>
                <StructuredListWrapper isCondensed>
                  <StructuredListBody>
                    {activity.map((entry) => (
                      <StructuredListRow key={entry.id}>
                        <StructuredListCell>
                          <strong>{entry.user?.name}</strong>{" "}
                          {entry.action.replace(/_/g, " ")}
                          {entry.oldValue && entry.newValue && (
                            <>
                              {" "}
                              from <Tag size="sm">{entry.oldValue}</Tag> to{" "}
                              <Tag size="sm">{entry.newValue}</Tag>
                            </>
                          )}
                          {!entry.oldValue && entry.newValue && (
                            <>
                              {" "}
                              — {entry.newValue}
                            </>
                          )}
                        </StructuredListCell>
                        <StructuredListCell>
                          {formatRelativeTime(entry.createdAt)}
                        </StructuredListCell>
                      </StructuredListRow>
                    ))}
                  </StructuredListBody>
                </StructuredListWrapper>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>

        <div className="issue-detail-sidebar">
          <div className="sidebar-field">
            <span className="field-label">Status</span>
            <Dropdown
              id="issue-status"
              titleText=""
              label="Status"
              hideLabel
              size="sm"
              items={ISSUE_STATUSES.map((s) => ({
                id: s,
                text: STATUS_LABELS[s],
              }))}
              itemToString={(item: { id: string; text: string } | null) => item?.text || ""}
              selectedItem={{
                id: issue.status,
                text: STATUS_LABELS[issue.status as keyof typeof STATUS_LABELS],
              }}
              onChange={({
                selectedItem,
              }: {
                selectedItem: { id: string; text: string } | null;
              }) => {
                if (selectedItem) updateIssue({ status: selectedItem.id });
              }}
            />
          </div>

          <div className="sidebar-field">
            <span className="field-label">Priority</span>
            <Dropdown
              id="issue-priority"
              titleText=""
              label="Priority"
              hideLabel
              size="sm"
              items={ISSUE_PRIORITIES.map((p) => ({
                id: p,
                text: PRIORITY_LABELS[p],
              }))}
              itemToString={(item: { id: string; text: string } | null) => item?.text || ""}
              selectedItem={{
                id: issue.priority,
                text: PRIORITY_LABELS[issue.priority as keyof typeof PRIORITY_LABELS],
              }}
              onChange={({
                selectedItem,
              }: {
                selectedItem: { id: string; text: string } | null;
              }) => {
                if (selectedItem) updateIssue({ priority: selectedItem.id });
              }}
            />
          </div>

          <div className="sidebar-field">
            <span className="field-label">Type</span>
            <Dropdown
              id="issue-type"
              titleText=""
              label="Type"
              hideLabel
              size="sm"
              items={ISSUE_TYPES.map((t) => ({
                id: t,
                text: TYPE_LABELS[t],
              }))}
              itemToString={(item: { id: string; text: string } | null) => item?.text || ""}
              selectedItem={{
                id: issue.type,
                text: TYPE_LABELS[issue.type as keyof typeof TYPE_LABELS],
              }}
              onChange={({
                selectedItem,
              }: {
                selectedItem: { id: string; text: string } | null;
              }) => {
                if (selectedItem) updateIssue({ type: selectedItem.id });
              }}
            />
          </div>

          <div className="sidebar-field">
            <span className="field-label">Story Points</span>
            <NumberInput
              id="issue-story-points"
              label=""
              hideLabel
              size="sm"
              min={0}
              max={100}
              value={issue.storyPoints ?? 0}
              onChange={(_e: unknown, { value }: { value: string | number }) => {
                const numVal = typeof value === "string" ? parseInt(value) : value;
                updateIssue({ storyPoints: numVal || null });
              }}
            />
          </div>

          <div className="sidebar-field">
            <span className="field-label">Assignee</span>
            <p>
              {issue.assignee ? (
                <span className="flex-row">
                  <UserAvatarComponent
                    name={issue.assignee.name}
                    size="small"
                  />
                  {issue.assignee.name}
                </span>
              ) : (
                "Unassigned"
              )}
            </p>
          </div>

          <div className="sidebar-field">
            <span className="field-label">Reporter</span>
            <p className="flex-row">
              <UserAvatarComponent
                name={issue.reporter.name}
                size="small"
              />
              {issue.reporter.name}
            </p>
          </div>

          <div className="sidebar-field">
            <span className="field-label">Labels</span>
            <div className="flex-row" style={{ flexWrap: "wrap" }}>
              {issue.labels.length > 0 ? (
                issue.labels.map((label) => (
                  <Tag key={label.id} size="sm" type={label.color as "blue" || "blue"}>
                    {label.name}
                  </Tag>
                ))
              ) : (
                <span style={{ color: "var(--cds-text-secondary)" }}>None</span>
              )}
            </div>
          </div>

          <div className="sidebar-field">
            <span className="field-label">Due Date</span>
            <p>{issue.dueDate ? formatDate(issue.dueDate) : "Not set"}</p>
          </div>

          <div className="sidebar-field">
            <span className="field-label">Created</span>
            <p>{formatDate(issue.createdAt)}</p>
          </div>

          <div className="sidebar-field">
            <span className="field-label">Updated</span>
            <p>{formatRelativeTime(issue.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
