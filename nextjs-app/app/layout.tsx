import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base Alchemy Gas Gateway & Signer",
  description: "Next.js App Router portal for Base Mainnet RPC and automated gas sweep / withdrawals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
