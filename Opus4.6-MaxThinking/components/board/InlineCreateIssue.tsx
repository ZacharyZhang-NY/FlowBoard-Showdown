"use client";

import { useState } from "react";
import { TextInput, Button } from "@carbon/react";
import { Add } from "@carbon/icons-react";

type InlineCreateIssueProps = {
  projectId: string;
  columnId: string;
  onCreated: () => void;
};

export default function InlineCreateIssue({
  projectId,
  columnId,
  onCreated,
}: InlineCreateIssueProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
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
          columnId,
          status: "todo",
        }),
      });
      setTitle("");
      setIsCreating(false);
      onCreated();
    } catch (err) {
      console.error("Failed to create issue:", err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setTitle("");
    }
  }

  if (!isCreating) {
    return (
      <div className="inline-create">
        <Button
          kind="ghost"
          size="sm"
          renderIcon={Add}
          onClick={() => setIsCreating(true)}
          style={{ width: "100%" }}
        >
          Add issue
        </Button>
      </div>
    );
  }

  return (
    <div className="inline-create">
      <TextInput
        id={`create-${columnId}`}
        size="sm"
        labelText=""
        hideLabel
        placeholder="Issue title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!title.trim()) {
            setIsCreating(false);
          }
        }}
        disabled={submitting}
        autoFocus
      />
    </div>
  );
}
