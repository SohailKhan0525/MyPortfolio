import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mohdzaheeruddin0525.vercel.app"),
  title: "Mohd Zaheer Uddin | ML & Data Science",
  description:
    "Portfolio of Mohd Zaheer Uddin, a CSIT undergraduate building practical machine learning and data science projects with Python.",
  openGraph: {
    title: "Mohd Zaheer Uddin | ML & Data Science",
    description:
      "Projects, learning journey, skills, resume, and contact details for Mohd Zaheer Uddin.",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#20211e" },
    { media: "(prefers-color-scheme: light)", color: "#f6f3eb" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body dir="ltr">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
