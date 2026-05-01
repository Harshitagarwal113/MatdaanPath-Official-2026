import type { Metadata, Viewport } from "next";

import AppAnalytics from "@/components/AppAnalytics";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://matdaanpath-app-135105451054.asia-south1.run.app"),
  title: {
    default: "MatdaanPath | Your Guide to Indian Elections",
    template: "%s | MatdaanPath",
  },
  description: "An interactive AI-driven assistant to help you navigate the Indian democratic process with ease and accuracy.",
  keywords: ["Election", "India", "Voter", "Matdaan", "Democracy", "AI Assistant"],
  applicationName: "MatdaanPath",
  authors: [{ name: "MatdaanPath Team" }],
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "MatdaanPath | Your Guide to Indian Elections",
    description: "Election education, deadlines, and AI assistance for Indian voters.",
    type: "website",
    locale: "en_IN",
    siteName: "MatdaanPath",
    url: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6366f1",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <AppAnalytics />
        {children}
      </body>
    </html>
  );
}
