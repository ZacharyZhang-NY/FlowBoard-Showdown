import type { Metadata } from "next";
import "@carbon/styles/css/styles.css";
import "@carbon/charts/styles.css";
import "swagger-ui-react/swagger-ui.css";

import { AppProviders } from "@/src/shared/ui/app/AppProviders";
import "./globals.scss";

export const metadata: Metadata = {
  title: "FlowBoard",
  description: "Carbon-powered local-first project management workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
