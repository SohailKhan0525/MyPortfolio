import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./enhancements.css";
import "./interaction-fixes.css";
import ThemeEnhancer from "./ThemeEnhancer";
import ClickSound from "./ClickSound";

export const metadata: Metadata = {
  metadataBase: new URL("https://mohd-zaheer-uddin.vercel.app"),
  title: "Mohd Zaheer Uddin | ML & Data Science",
  description: "Portfolio of Mohd Zaheer Uddin, a CSIT undergraduate building practical machine learning and data science projects with Python.",
  openGraph: {
    title: "Mohd Zaheer Uddin | ML & Data Science",
    description: "Projects, learning journey, skills, resume, and contact details for Mohd Zaheer Uddin.",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#f4f4f2" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body dir="ltr">
        <ThemeEnhancer />
        <ClickSound />
        {children}
      </body>
    </html>
  );
}
