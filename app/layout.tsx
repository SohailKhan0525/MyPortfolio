import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeEffects from "./theme-effects";

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
  themeColor: "#000000",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeEffects />
        {children}
      </body>
    </html>
  );
}
