"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Building2, Sun, Moon, Zap, LogOut, UserCircle, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { getRoleBadge } from "@/lib/rbac";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const role = (session?.user as any)?.role;
  const badge = getRoleBadge(role);

  if (status === "loading") {
    return (
      <header className="border-b border-border bg-background/85 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-fg font-display font-bold text-[0.95rem] leading-none">ID</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
            <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  if (!session) {
    return (
      <header className="border-b border-border bg-background/85 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-fg font-display font-bold text-[0.95rem] leading-none">ID</span>
            </div>
            <span className="font-display font-bold text-[1.0625rem] tracking-tight text-foreground hidden sm:inline">
              School ID Extractor
            </span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-border bg-background/85 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-fg font-display font-bold text-[0.95rem] leading-none">ID</span>
          </div>
          <span className="font-display font-bold text-[1.0625rem] tracking-tight text-foreground hidden sm:inline">
            School ID Extractor
          </span>
        </Link>

        {/* Right cluster */}
        <nav className="flex items-center gap-2">
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

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 h-9 rounded-lg text-muted-fg hover:text-foreground hover:bg-muted transition-colors"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <UserCircle size={18} strokeWidth={1.75} />
              <span className="hidden sm:inline text-[0.8125rem] font-medium text-foreground">
                {session.user?.name || session.user?.email}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.625rem] font-semibold border ${badge.className}`}
              >
                {badge.label}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-[0.8125rem] font-medium text-foreground truncate">
                      {session.user?.name}
                    </p>
                    <p className="text-[0.75rem] text-muted-fg truncate mt-0.5">
                      {session.user?.email}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.625rem] font-semibold border mt-2 ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[0.875rem] text-danger hover:bg-danger-bg transition-colors"
                  >
                    <LogOut size={16} strokeWidth={1.75} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}