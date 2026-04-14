"use client";

import { useState, useRef, useEffect } from "react";
import { TextInput, Button } from "@carbon/react";

interface InlineCreateIssueProps {
  onSubmit: (title: string) => void;
}

export function InlineCreateIssue({ onSubmit }: InlineCreateIssueProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && title.trim()) {
      onSubmit(title.trim());
      setTitle("");
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setTitle("");
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button kind="ghost" size="sm" onClick={() => setIsOpen(true)}>
        + Add issue
      </Button>
    );
  }

  return (
    <TextInput
      id="inline-create"
      labelText=""
      hideLabel
      placeholder="Enter issue title..."
      value={title}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        if (!title.trim()) setIsOpen(false);
      }}
      ref={inputRef as any}
    />
  );
}
