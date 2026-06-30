import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientRoot from "./ClientRoot";
import HeaderNav from "./components/HeaderNav";
import { SupabaseProvider } from "@/context/SupabaseProvider";
import NoStrictProvider from "./NoStrictProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BikeFix",
  description: "BikeFix App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <NoStrictProvider>
          <SupabaseProvider>
            <HeaderNav />

            <main className="flex-1">
              <ClientRoot>{children}</ClientRoot>
            </main>
          </SupabaseProvider>
        </NoStrictProvider>
      </body>
    </html>
  );
}
