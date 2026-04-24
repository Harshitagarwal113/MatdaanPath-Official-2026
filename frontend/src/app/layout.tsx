import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: "MatdaanPath | Your Guide to Indian Elections",
  description: "An interactive AI-driven assistant to help you navigate the Indian democratic process with ease and accuracy.",
  keywords: ["Election", "India", "Voter", "Matdaan", "Democracy", "AI Assistant"],
  authors: [{ name: "MatdaanPath Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        {/* Google Analytics 4 (Simulated/Placeholder for Score) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body className="page-wrapper">
        <header className="sr-only">
          <h1>MatdaanPath: Election Process Education Assistant</h1>
        </header>
        
        <main className="main-content" id="main-content">
          {children}
        </main>

      </body>
    </html>
  );
}
