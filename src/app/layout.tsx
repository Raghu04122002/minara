import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minara Admin",
  description: "Engagement Insights Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import SecurityGuard from "@/components/SecurityGuard";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isRestricted = user?.email === 'miftaah@minara.org.in';

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SecurityGuard isRestricted={isRestricted} />
        {children}
      </body>
    </html>
  );
}
