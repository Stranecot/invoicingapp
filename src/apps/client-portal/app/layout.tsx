import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoice App - Modern Invoicing Solution",
  description: "Create and manage invoices with ease",
};

// Check if Clerk is configured
const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key_here' &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {!isClerkConfigured && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-3 text-center">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Clerk not configured.</strong> Please update your .env file with valid Clerk API keys.
              See <code className="bg-yellow-100 px-2 py-1 rounded">SETUP_GUIDE.md</code> for instructions.
            </p>
          </div>
        )}
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="container mx-auto p-4 md:p-8 max-w-7xl pb-20 md:pb-8">
              {children}
            </div>
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if properly configured
  if (isClerkConfigured) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
