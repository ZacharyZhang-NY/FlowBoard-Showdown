import { redirect } from "next/navigation";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function BoardsRedirectPage() {
  const [board] = await db.select().from(schema.boards).limit(1);
  if (board) {
    redirect(`/boards/${board.id}`);
  }
  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <EmptyState title="No boards found" subtitle="Create a board in project settings to get started." />
    </div>
  );
}
