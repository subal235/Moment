import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reality Rehearsal | An AI World Model for Emergency Decision-Making",
  description:
    "Engineering the future of emergency healthcare with interactive world models and multi-agent simulation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
