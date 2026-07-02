import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tennis SMS Reminders",
  description: "Lightweight SMS lesson reminders for tennis instructors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
