import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerOps Evidence Console",
  description: "Human control plane for CareerOps Evidence browsing, review, provenance, and system health."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
