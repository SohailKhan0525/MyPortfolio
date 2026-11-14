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
  title: "Zaheer’s Signal Garden | Mohd Zaheer Uddin",
  description: "Explore the Python and machine learning projects of Mohd Zaheer Uddin, a CSIT student working toward ML engineering. Teach a garden with examples, inspect its predictions, and visit seven projects.",
  openGraph: {
    title: "Zaheer’s Signal Garden | Mohd Zaheer Uddin",
    description: "Plant ferns and poppies in Zaheer’s playable machine learning garden, then explore the student projects behind his portfolio.",
    images: [{ url: "/garden/conservatory.webp", width: 1536, height: 1024, alt: "The miniature glasshouse where Zaheer’s signal garden grows." }],
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
