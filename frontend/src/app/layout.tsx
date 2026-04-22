import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MatdaanPath | Election Process Assistant",
  description: "An interactive assistant to help you understand the Indian election process.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} page-wrapper`}>
        {/* We can add a global Navigation header here later */}
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
