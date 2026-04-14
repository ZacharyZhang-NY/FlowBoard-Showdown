"use client";

import { StructuredListWrapper, StructuredListRow, StructuredListCell, StructuredListBody } from "@carbon/react";
import { formatDistanceToNow } from "date-fns";
import type { Comment } from "@/types";

export function CommentList({ comments }: { comments: Comment[] }) {
  return (
    <StructuredListWrapper>
      <StructuredListBody>
        {comments.map((comment) => (
          <StructuredListRow key={comment.id}>
            <StructuredListCell>
              <div style={{ fontWeight: 600 }}>{comment.author?.name || "Unknown"}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", marginBottom: "0.25rem" }}>
                {formatDistanceToNow(new Date(comment.createdAt))} ago
              </div>
              <div>{comment.content}</div>
            </StructuredListCell>
          </StructuredListRow>
        ))}
        {comments.length === 0 && (
          <StructuredListRow>
            <StructuredListCell>No comments yet</StructuredListCell>
          </StructuredListRow>
        )}
      </StructuredListBody>
    </StructuredListWrapper>
  );
}
