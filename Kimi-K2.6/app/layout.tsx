import type { Metadata } from "next";
import "./globals.scss";
import "@carbon/charts-react/styles.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FlowBoard",
  description: "Team project management board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
