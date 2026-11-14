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
  title: "The Ink Observatory | Mohd Zaheer Uddin",
  description: "Draw a digit and see how a model reads it. Explore Zaheer’s handwritten digit recognizer, playable signal garden and seven Python and machine learning projects.",
  openGraph: {
    title: "The Ink Observatory | Mohd Zaheer Uddin",
    description: "Draw on the glass of Zaheer’s handwriting reader and see the examples behind its guess. Explore his machine learning studies and playable garden.",
    images: [{ url: "/ink/observatory.webp", width: 1536, height: 1024, alt: "A brass and green enamel optical reader in Zaheer’s Ink Observatory." }],
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
