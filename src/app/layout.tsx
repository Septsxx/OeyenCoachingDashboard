import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Oeyen Coaching",
  description: "Coach platform",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value ?? cookieStore.get('coach-theme')?.value ?? 'dark';
  return (
    <html lang="nl" data-theme={theme} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
