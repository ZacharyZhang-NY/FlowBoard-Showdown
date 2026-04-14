"use client";

import { useState } from "react";
import { Button, InlineLoading, TextInput } from "@carbon/react";

type InlineIssueComposerProps = {
  busy: boolean;
  onCreate: (title: string) => Promise<void>;
};

export function InlineIssueComposer({ busy, onCreate }: InlineIssueComposerProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  if (!open) {
    return (
      <Button
        className="flowboard-inline-composer__trigger"
        kind="ghost"
        onClick={() => {
          setOpen(true);
        }}
      >
        Add issue
      </Button>
    );
  }

  return (
    <form
      className="flowboard-inline-composer"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!title.trim()) {
          return;
        }
        await onCreate(title.trim());
        setTitle("");
        setOpen(false);
      }}
    >
      <TextInput
        autoFocus
        id="inline-issue-title"
        labelText="Issue title"
        onChange={(event) => {
          setTitle(event.target.value);
        }}
        value={title}
      />
      <div className="flowboard-inline-composer__actions">
        <Button disabled={busy || !title.trim()} size="sm" type="submit">
          Create
        </Button>
        <Button
          kind="ghost"
          onClick={() => {
            setOpen(false);
            setTitle("");
          }}
          size="sm"
          type="button"
        >
          Cancel
        </Button>
      </div>
      {busy ? <InlineLoading description="Creating issue" status="active" /> : null}
    </form>
  );
}
