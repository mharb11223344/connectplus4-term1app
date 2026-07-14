import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mona’s English Garden",
    template: "%s | Mona’s English Garden",
  },
  description: "Primary 4 English, Term 1 — joyful lessons, stories, and interactive challenges by Mrs. Mona Harb.",
  applicationName: "Mona’s English Garden",
  authors: [{ name: "Mrs. Mona Harb" }],
  keywords: ["Primary 4 English", "English learning", "Egypt curriculum", "Mrs. Mona Harb"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
