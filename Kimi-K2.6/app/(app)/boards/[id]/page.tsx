"use client";

import { useParams } from "next/navigation";
import { BoardView } from "@/components/board/BoardView";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;

  return (
    <div style={{ height: "calc(100vh - 6rem)" }}>
      <BoardView boardId={boardId} />
    </div>
  );
}
