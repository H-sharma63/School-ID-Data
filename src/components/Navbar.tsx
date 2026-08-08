"use client";

import Link from "next/link";
import { Building2, Sun, Moon, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const next = !html.classList.contains("dark");
    html.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight text-foreground">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-fg font-bold text-sm">ID</span>
          </div>
          <span className="hidden sm:inline">School ID Extractor</span>
        </Link>

        {/* Nav + Theme toggle */}
        <div className="flex items-center gap-0.5">
          <Link
            href="/quick"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors mr-2"
            title="Quick Export Mode (No Database)"
          >
            <Zap size={15} className="fill-current" />
            <span className="text-sm font-medium hidden sm:inline">Quick Export</span>
          </Link>
          <Link
            href="/schools"
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-fg hover:text-foreground"
            title="Browse school hierarchy"
          >
            <Building2 size={18} />
          </Link>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-fg hover:text-foreground hover:bg-muted/50 transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}