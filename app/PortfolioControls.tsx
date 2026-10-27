"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function Header() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("portfolio-theme");
    } catch {}
    const next = saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }, []);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("portfolio-theme", next ? "dark" : "light");
    } catch {}
  }
  return (
    <header
      className="site-header"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <Link
        href="/#top"
        className="brand"
        onClick={() => setOpen(false)}
        aria-label="Mohd Zaheer Uddin, home"
      >
        mz<span>.</span>
      </Link>
      <nav
        id="primary-navigation"
        aria-label="Primary navigation"
        className={open ? "navigation is-open" : "navigation"}
      >
        {[
          ["Work", "/#work"],
          ["About", "/#about"],
          ["Resume", "/resume"],
          ["Contact", "/#contact"],
        ].map(([label, href]) => (
          <Link key={label} href={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="header-controls">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
        >
          <span aria-hidden="true">{dark ? "☀" : "◐"}</span>
        </button>
        <button
          ref={menuButton}
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
    </header>
  );
}

export function CopyEmail({ email }: { email: string }) {
  const [status, setStatus] = useState("");
  return (
    <div className="copy-control">
      <button
        type="button"
        className="text-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(email);
            setStatus("Email copied.");
          } catch {
            setStatus("Please select the email link to open your mail app.");
          }
        }}
      >
        Copy email <span aria-hidden="true">↗</span>
      </button>
      <span role="status">{status}</span>
    </div>
  );
}
