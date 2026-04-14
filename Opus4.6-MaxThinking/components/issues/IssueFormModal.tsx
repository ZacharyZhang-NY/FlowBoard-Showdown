"use client";

import { useState } from "react";
import {
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  TextArea,
  Dropdown,
  Button,
  Stack,
} from "@carbon/react";
import {
  ISSUE_STATUSES,
  ISSUE_PRIORITIES,
  ISSUE_TYPES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  TYPE_LABELS,
} from "@/types";

type IssueFormModalProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function IssueFormModal({
  projectId,
  open,
  onClose,
  onCreated,
}: IssueFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [type, setType] = useState("task");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      await fetch(`/api/v1/projects/${projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          type,
          status: "todo",
        }),
      });
      onCreated();
    } catch (err) {
      console.error("Failed to create issue:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ComposedModal open={open} onClose={onClose} size="md">
      <ModalHeader title="New Issue" />
      <ModalBody>
        <Stack gap={6}>
          <TextInput
            id="issue-title"
            labelText="Title"
            placeholder="Issue title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <TextArea
            id="issue-description"
            labelText="Description"
            placeholder="Describe the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Dropdown
            id="issue-priority"
            titleText="Priority"
            label="Select priority"
            items={ISSUE_PRIORITIES.map((p) => ({ id: p, text: PRIORITY_LABELS[p] }))}
            itemToString={(item: { id: string; text: string } | null) => item?.text || ""}
            selectedItem={{ id: priority, text: PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] }}
            onChange={({ selectedItem }: { selectedItem: { id: string; text: string } | null }) => {
              if (selectedItem) setPriority(selectedItem.id);
            }}
          />
          <Dropdown
            id="issue-type"
            titleText="Type"
            label="Select type"
            items={ISSUE_TYPES.map((t) => ({ id: t, text: TYPE_LABELS[t] }))}
            itemToString={(item: { id: string; text: string } | null) => item?.text || ""}
            selectedItem={{ id: type, text: TYPE_LABELS[type as keyof typeof TYPE_LABELS] }}
            onChange={({ selectedItem }: { selectedItem: { id: string; text: string } | null }) => {
              if (selectedItem) setType(selectedItem.id);
            }}
          />
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!title.trim() || submitting}>
          {submitting ? "Creating..." : "Create Issue"}
        </Button>
      </ModalFooter>
    </ComposedModal>
  );
}
