import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOOP | Robotics Data Infrastructure & Physical AI Adaptation Layer",
  description:
    "Data infrastructure that tests, breaks, and hardens physical AI models before real-world deployment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#ECEBE8] text-[#111111] font-sans selection:bg-[#111111] selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
