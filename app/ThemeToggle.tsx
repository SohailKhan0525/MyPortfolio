"use client";

import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import { usePortfolioMotion } from "./MotionPreferences";
import "./theme-motion.css";

export default function ThemeToggle() {
  const { reduced, ready } = usePortfolioMotion();
  return <AnimatedThemeToggler duration={650} reduceMotion={reduced} disabled={!ready} />;
}
