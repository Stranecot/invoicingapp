import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Dashboard - Invoice App",
  description: "Administrative dashboard for managing organizations, users, and invitations",
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
              Warning: Clerk not configured. Please update your .env file with valid Clerk API keys.
              See .env.example for instructions.
            </p>
          </div>
        )}
        {children}
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if properly configured
  if (isClerkConfigured) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
