import type { Metadata } from "next";
import "./globals.css";
import "./evidence-live.css";

export const metadata: Metadata = {
  title: "CareerOps Evidence Console",
  description: "Read-only console for production canonical CareerOps Evidence through CareerOps-Engine."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
