import { describe, expect, it } from "vitest";

import { createIssueSchema, updateIssueSchema } from "@/src/modules/issues/contract/issue.schemas";

describe("issue contract schemas", () => {
  it("fills create issue defaults from the OpenAPI contract", () => {
    const payload = createIssueSchema.parse({
      boardId: crypto.randomUUID(),
      title: "Ship dashboard health summary",
      labelIds: [],
    });

    expect(payload.priority).toBe("medium");
    expect(payload.status).toBe("todo");
    expect(payload.type).toBe("task");
    expect(payload.labelIds).toEqual([]);
  });

  it("requires optimistic concurrency version on update", () => {
    expect(() =>
      updateIssueSchema.parse({
        title: "Rename issue",
      }),
    ).toThrow();

    const payload = updateIssueSchema.parse({
      version: 3,
      title: "Rename issue",
    });

    expect(payload.version).toBe(3);
    expect(payload.title).toBe("Rename issue");
  });
});
