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
    <header className="border-b border-border bg-background/85 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-fg font-display font-bold text-[0.95rem] leading-none">
              ID
           </span>
         </div>
          <span className="font-display font-bold text-[1.0625rem] tracking-tight text-foreground hidden sm:inline">
            School ID Extractor
         </span>
       </Link>

        {/* Right cluster */}
        <nav className="flex items-center gap-1">
          <Link
            href="/quick"
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-[0.8125rem] font-medium text-muted-fg hover:text-foreground hover:bg-muted transition-colors"
            title="Quick export (no database)"
          >
            <Zap size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">Quick</span>
         </Link>
          <Link
            href="/schools"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-fg hover:text-foreground hover:bg-muted transition-colors"
            title="Browse school hierarchy"
          >
            <Building2 size={17} strokeWidth={1.5} />
         </Link>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-fg hover:text-foreground hover:bg-muted transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle color theme"
          >
            {isDark ? <Sun size={17} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
         </button>
       </nav>
     </div>
   </header>
  );
}
