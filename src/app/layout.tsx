import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asrii Automate — Production Instagram Automation for Developers",
  description:
    "Official Meta Graph API automation platform for Instagram Professional accounts. Build reliable comment-to-DM workflows, test with simulated events, and manage webhooks.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] antialiased selection:bg-[#F5F5F5] selection:text-[#0A0A0A]">
        {children}
      </body>
    </html>
  );
}
