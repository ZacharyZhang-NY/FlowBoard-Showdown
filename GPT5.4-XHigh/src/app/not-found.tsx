import Link from "next/link";
import { Tile } from "@carbon/react";

export default function NotFoundPage() {
  return (
    <div className="app-fallback">
      <Tile className="app-fallback__tile">
        <h1>页面不存在</h1>
        <p>当前地址没有可用内容。</p>
        <Link href="/dashboard">返回 Dashboard</Link>
      </Tile>
    </div>
  );
}
