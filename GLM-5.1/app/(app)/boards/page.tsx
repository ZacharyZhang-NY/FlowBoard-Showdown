import { db } from "@/db";
import { boards } from "@/db/schema";
import { redirect } from "next/navigation";

export default function BoardsRedirectPage() {
  const [firstBoard] = db.select().from(boards).limit(1).all();
  if (firstBoard) redirect(`/boards/${firstBoard.id}`);
  return <div style={{ padding: 32 }}>No boards found. Create a project first.</div>;
}
