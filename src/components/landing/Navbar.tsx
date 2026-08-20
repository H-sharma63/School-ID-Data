"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { UserCircle, Palette, Home, Building2, Zap, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

interface LandingNavbarProps {
  onLoginClick?: () => void;
}

export default function LandingNavbar({ onLoginClick }: LandingNavbarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  if (status === "loading") {
    return (
      <header className="border-b border-border bg-background/85 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} className="rounded-lg" />
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
          <Link href="/" className="flex items-center gap-2.5 group/nav-brand" aria-label="School ID Data home">
            <Logo size={32} className="rounded-lg" />
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="#how-it-works" className="text-sm font-medium text-muted-fg hover:text-foreground transition-colors">How it works</Link>
            <Link href="#features" className="text-sm font-medium text-muted-fg hover:text-foreground transition-colors">Features</Link>
            <Link href="#workflow" className="text-sm font-medium text-muted-fg hover:text-foreground transition-colors">Workflow</Link>
            <button
              onClick={onLoginClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover active:translate-y-[1px] transition-all duration-150"
            >
              Get started
            </button>
          </nav>
        </div>
      </header>
    );
  }

  // Authenticated - match the main navbar exactly
  const navLinks = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/schools", label: "Schools", icon: Building2 },
    { href: "/quick", label: "Quick", icon: Zap },
  ];

  return (
    <header className="border-b border-border bg-background/85 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group/nav-brand">
          <Logo size={32} className="rounded-lg" />
        </Link>

        {/* Right cluster */}
        <nav className="flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-[0.8125rem] font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-fg hover:text-foreground hover:bg-muted"
                }`}
                title={link.label}
              >
                <link.icon size={15} strokeWidth={1.75} />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 h-9 rounded-lg text-muted-fg hover:text-foreground hover:bg-muted transition-colors"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user?.name || "User"}
                  className="w-7 h-7 rounded-full border border-border"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.style.display = 'none';
                    const fallback = img.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
              ) : null}
              <UserCircle size={18} strokeWidth={1.75} style={{ display: session.user?.image ? 'none' : 'block' }} />
              <span className="hidden sm:inline text-[0.8125rem] font-medium text-foreground">
                {session.user?.name || session.user?.email}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-card border border-border rounded-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-[0.8125rem] font-medium text-foreground truncate">
                      {session.user?.name}
                    </p>
                    <p className="text-[0.75rem] text-muted-fg truncate mt-0.5">
                      {session.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const html = document.documentElement;
                      const next = !html.classList.contains("dark");
                      html.classList.toggle("dark", next);
                      localStorage.setItem("theme", next ? "dark" : "light");
                      setIsDark(next);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[0.875rem] text-muted-fg hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Palette size={16} strokeWidth={1.75} />
                    Change appearance
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[0.875rem] text-danger hover:bg-danger-bg transition-colors"
                  >
                    <X size={16} strokeWidth={1.75} />
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