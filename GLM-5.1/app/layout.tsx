import type { Metadata } from "next";
import { ThemeProvider } from "@/components/shell/ThemeProvider";
import "./globals.scss";

export const metadata: Metadata = {
  title: "FlowBoard",
  description: "Team Project Management Board",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
