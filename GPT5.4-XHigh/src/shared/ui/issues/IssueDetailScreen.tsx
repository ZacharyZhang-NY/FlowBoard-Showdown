"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Dropdown,
  InlineNotification,
  MultiSelect,
  StructuredListBody,
  StructuredListCell,
  StructuredListRow,
  StructuredListWrapper,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  TextArea,
  TextInput,
  Tile,
  Button,
} from "@carbon/react";
import { formatDistanceToNow, parseISO } from "date-fns";

import type { IssueDetail, UpdateIssueRequest } from "@/src/modules/issues/contract/issue.schemas";
import { PageLayout } from "@/src/shared/ui/app/PageLayout";
import { PriorityTag, StatusTag } from "@/src/shared/ui/app/Tags";
import {
  useCreateCommentMutation,
  useIssueActivitySuspense,
  useIssueCommentsSuspense,
  useIssueSuspense,
  useUpdateIssueMutation,
} from "@/src/state/query/useIssues";
import { useLabelsSuspense } from "@/src/state/query/useSettings";
import { useSprintsSuspense } from "@/src/state/query/useSprints";

type IssueDetailScreenProps = {
  issueId: string;
};

type IssueDraftPatch = Partial<
  Pick<
    UpdateIssueRequest,
    "title" | "description" | "status" | "priority" | "type" | "storyPoints" | "dueDate" | "sprintId" | "labelIds"
  >
>;

type LabelSelectItem = IssueDetail["labels"][number];

type WorkflowOption<TValue extends string> = {
  id: TValue;
  label: string;
};

const statusOptions: WorkflowOption<IssueDetail["status"]>[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
  { id: "blocked", label: "Blocked" },
];

const priorityOptions: WorkflowOption<IssueDetail["priority"]>[] = [
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

const typeOptions: WorkflowOption<IssueDetail["type"]>[] = [
  { id: "task", label: "Task" },
  { id: "bug", label: "Bug" },
  { id: "feature", label: "Feature" },
  { id: "improvement", label: "Improvement" },
];

function findSelectedOption<TValue extends string>(
  options: WorkflowOption<TValue>[],
  value: TValue,
): WorkflowOption<TValue> {
  return options.find((option) => option.id === value) ?? options[0]!;
}

type MetadataTileProps = {
  title: string;
  children: ReactNode;
};

function MetadataTile({
  title,
  children,
}: MetadataTileProps) {
  return (
    <Tile className="flowboard-panel">
      <div className="flowboard-panel__header">
        <h2>{title}</h2>
      </div>
      {children}
    </Tile>
  );
}

export function IssueDetailScreen({ issueId }: IssueDetailScreenProps) {
  const { data: issue } = useIssueSuspense(issueId);
  const { data: comments } = useIssueCommentsSuspense(issueId);
  const { data: activity } = useIssueActivitySuspense(issueId);
  const { data: labels } = useLabelsSuspense(issue.projectId);
  const { data: sprints } = useSprintsSuspense(issue.projectId);
  const updateIssueMutation = useUpdateIssueMutation(issueId);
  const createCommentMutation = useCreateCommentMutation(issueId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [draft, setDraft] = useState(issue);

  const selectedLabels = useMemo(
    () =>
      labels.items.filter((label) =>
        draft.labels.some((selectedLabel) => selectedLabel.id === label.id),
      ),
    [draft.labels, labels.items],
  );

  const saveIssue = async (patch: IssueDraftPatch) => {
    try {
      setErrorMessage(null);
      const payload: UpdateIssueRequest = {
        version: draft.version,
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
        ...(patch.type !== undefined ? { type: patch.type } : {}),
        ...(patch.storyPoints !== undefined ? { storyPoints: patch.storyPoints } : {}),
        ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : {}),
        ...(patch.sprintId !== undefined ? { sprintId: patch.sprintId } : {}),
        ...(patch.labelIds !== undefined ? { labelIds: patch.labelIds } : {}),
      };
      const nextIssue = await updateIssueMutation.mutateAsync(payload);

      setDraft(nextIssue);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Issue update failed");
    }
  };

  return (
    <PageLayout
      breadcrumb={[
        { href: "/issues", label: "Issues" },
        { label: draft.key },
      ]}
      description={draft.title}
      title={draft.title}
      sidebar={
        <div className="flowboard-stack">
          {errorMessage ? (
            <InlineNotification
              hideCloseButton
              kind="error"
              lowContrast
              subtitle={errorMessage}
              title="Save failed"
            />
          ) : null}
          <MetadataTile title="Workflow">
            <div className="flowboard-stack">
              <Dropdown
                id="issue-status"
                itemToString={(item) => item?.label ?? ""}
                items={statusOptions}
                label="Status"
                onChange={({ selectedItem }) => {
                  if (!selectedItem) {
                    return;
                  }

                  setDraft((current) => ({ ...current, status: selectedItem.id }));
                  void saveIssue({ status: selectedItem.id });
                }}
                selectedItem={findSelectedOption(statusOptions, draft.status)}
                titleText="Status"
              />
              <Dropdown
                id="issue-priority"
                itemToString={(item) => item?.label ?? ""}
                items={priorityOptions}
                label="Priority"
                onChange={({ selectedItem }) => {
                  if (!selectedItem) {
                    return;
                  }

                  setDraft((current) => ({ ...current, priority: selectedItem.id }));
                  void saveIssue({ priority: selectedItem.id });
                }}
                selectedItem={findSelectedOption(priorityOptions, draft.priority)}
                titleText="Priority"
              />
              <Dropdown
                id="issue-type"
                itemToString={(item) => item?.label ?? ""}
                items={typeOptions}
                label="Type"
                onChange={({ selectedItem }) => {
                  if (!selectedItem) {
                    return;
                  }

                  setDraft((current) => ({ ...current, type: selectedItem.id }));
                  void saveIssue({ type: selectedItem.id });
                }}
                selectedItem={findSelectedOption(typeOptions, draft.type)}
                titleText="Type"
              />
              <Dropdown
                disabled
                id="issue-assignee"
                itemToString={(item) => item?.label ?? ""}
                items={[
                  {
                    id: draft.assignee?.id ?? "",
                    label: draft.assignee?.name ?? "Unassigned",
                  },
                ]}
                label="Assignee"
                selectedItem={{
                  id: draft.assignee?.id ?? "",
                  label: draft.assignee?.name ?? "Unassigned",
                }}
                titleText="Assignee"
              />
              <Dropdown
                id="issue-sprint"
                itemToString={(item) => item?.label ?? ""}
                items={[
                  { id: "", label: "Backlog" },
                  ...sprints.items.map((sprint) => ({ id: sprint.id, label: sprint.name })),
                ]}
                label="Sprint"
                onChange={({ selectedItem }) => {
                  const nextSprintId = selectedItem?.id || null;
                  setDraft((current) => ({ ...current, sprintId: nextSprintId }));
                  void saveIssue({ sprintId: nextSprintId });
                }}
                selectedItem={{
                  id: draft.sprintId ?? "",
                  label:
                    sprints.items.find((sprint) => sprint.id === draft.sprintId)?.name ??
                    "Backlog",
                }}
                titleText="Sprint"
              />
              <TextInput
                id="issue-story-points"
                labelText="Story points"
                onBlur={(event) => {
                  const value = event.target.value ? Number(event.target.value) : null;
                  setDraft((current) => ({ ...current, storyPoints: value }));
                  void saveIssue({ storyPoints: value });
                }}
                type="number"
                defaultValue={draft.storyPoints ?? ""}
              />
              <TextInput
                id="issue-due-date"
                labelText="Due date"
                onBlur={(event) => {
                  const nextValue = event.target.value
                    ? new Date(`${event.target.value}T00:00:00.000Z`).toISOString()
                    : null;
                  setDraft((current) => ({ ...current, dueDate: nextValue }));
                  void saveIssue({ dueDate: nextValue });
                }}
                type="date"
                defaultValue={draft.dueDate ? draft.dueDate.slice(0, 10) : ""}
              />
              <MultiSelect
                id="issue-labels"
                itemToString={(item) => item?.name ?? ""}
                items={labels.items}
                label="Labels"
                onChange={({ selectedItems }) => {
                  const labelIds = (selectedItems ?? []).map((item) => item.id);
                  setDraft((current) => ({
                    ...current,
                    labels: labels.items.filter((label) => labelIds.includes(label.id)),
                  }));
                  void saveIssue({ labelIds });
                }}
                selectedItems={selectedLabels}
                titleText="Labels"
              />
            </div>
          </MetadataTile>
          <MetadataTile title="Metadata">
            <div className="flowboard-stack flowboard-subtle">
              <div>Created {formatDistanceToNow(parseISO(draft.createdAt), { addSuffix: true })}</div>
              <div>Updated {formatDistanceToNow(parseISO(draft.updatedAt), { addSuffix: true })}</div>
              <div>
                <StatusTag status={draft.status} /> <PriorityTag priority={draft.priority} />
              </div>
            </div>
          </MetadataTile>
        </div>
      }
    >
      <div className="flowboard-stack">
        <Tile className="flowboard-panel">
          <div className="flowboard-stack">
            <TextInput
              id="issue-title"
              labelText="Title"
              onBlur={(event) => {
                const nextTitle = event.target.value.trim();
                setDraft((current) => ({ ...current, title: nextTitle }));
                void saveIssue({ title: nextTitle });
              }}
              defaultValue={draft.title}
            />
            <TextArea
              id="issue-description"
              labelText="Description"
              onBlur={(event) => {
                const nextDescription = event.target.value.trim() || null;
                setDraft((current) => ({ ...current, description: nextDescription }));
                void saveIssue({ description: nextDescription });
              }}
              rows={8}
              defaultValue={draft.description ?? ""}
            />
          </div>
        </Tile>
        <Tile className="flowboard-panel">
          <Tabs>
            <TabList aria-label="Issue detail sections" contained>
              <Tab>Comments</Tab>
              <Tab>Activity</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <div className="flowboard-stack">
                  <TextArea
                    id="new-comment"
                    labelText="Add comment"
                    onChange={(event) => {
                      setCommentDraft(event.target.value);
                    }}
                    rows={4}
                    value={commentDraft}
                  />
                  <Button
                    disabled={createCommentMutation.isPending || !commentDraft.trim()}
                    onClick={async () => {
                      await createCommentMutation.mutateAsync({
                        content: commentDraft.trim(),
                      });
                      setCommentDraft("");
                    }}
                  >
                    Add comment
                  </Button>
                  <StructuredListWrapper>
                    <StructuredListBody>
                      {comments.items.map((comment) => (
                        <StructuredListRow key={comment.id}>
                          <StructuredListCell>
                            <div className="flowboard-stack">
                              <div>
                                <strong>{comment.author.name}</strong>{" "}
                                <span className="flowboard-subtle">
                                  {formatDistanceToNow(parseISO(comment.createdAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                              <div>{comment.content}</div>
                            </div>
                          </StructuredListCell>
                        </StructuredListRow>
                      ))}
                    </StructuredListBody>
                  </StructuredListWrapper>
                </div>
              </TabPanel>
              <TabPanel>
                <StructuredListWrapper>
                  <StructuredListBody>
                    {activity.items.map((entry) => (
                      <StructuredListRow key={entry.id}>
                        <StructuredListCell>
                          <div className="flowboard-stack">
                            <div>
                              <strong>{entry.actor.name}</strong> {entry.action}
                            </div>
                            <div className="flowboard-subtle">
                              {formatDistanceToNow(parseISO(entry.createdAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </StructuredListCell>
                      </StructuredListRow>
                    ))}
                  </StructuredListBody>
                </StructuredListWrapper>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Tile>
      </div>
    </PageLayout>
  );
}
