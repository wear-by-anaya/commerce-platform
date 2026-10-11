import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { APP_TITLE } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: "Private internal operations platform boilerplate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
