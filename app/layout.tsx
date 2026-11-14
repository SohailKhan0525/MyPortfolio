import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./enhancements.css";
import "./interaction-fixes.css";
import "./mobile-polish.css";
import "./terminal-polish.css";
import "./premium-enhancements.css";
import "./portfolio-craft.css";
import "./portfolio-motion.css";
import ClickSound from "./ClickSound";
import ChromeEffects from "./ChromeEffects";
import PortfolioMotionProvider from "./MotionPreferences";
import SmoothScroll from "./SmoothScroll";
import { DEFAULT_THEME, THEME_COLORS, themeBootstrapScript } from "./theme-preference";
import "./motion-system.css";
import "./scroll-performance.css";
import "./portfolio-refinement.css";
import "./motion-choreography.css";
import "./gsap-redesign.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mohdzaheeruddin0525.vercel.app"),
  title: "Zaheer’s Field Lab | Mohd Zaheer Uddin",
  description: "Explore the Python and machine learning projects of Mohd Zaheer Uddin, a CSIT student working toward ML engineering. Visit the field stations and try a model yourself.",
  openGraph: {
    title: "Zaheer’s Field Lab | Mohd Zaheer Uddin",
    description: "A student’s machine learning portfolio. Explore the field stations, fit a line to house prices, and see how a classifier makes decisions.",
    images: [{ url: "/world/learning-lab.webp", width: 1536, height: 1024, alt: "A miniature valley with a cottage, a quake station, and a heart lab connected by rail." }],
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: THEME_COLORS.light,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" data-theme={DEFAULT_THEME} style={{ colorScheme: DEFAULT_THEME }} suppressHydrationWarning>
      <head>
        <script id="portfolio-theme-init" dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body dir="ltr">
        <ClickSound />
        <PortfolioMotionProvider>
          <SmoothScroll />
          <ChromeEffects />
          {children}
        </PortfolioMotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
