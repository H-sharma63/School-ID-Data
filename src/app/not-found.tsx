"use client";

import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center py-16">
        <div className="mb-8">
          <span className="font-display text-9xl font-bold text-primary/20">404</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mb-4">
          Page not found
        </h1>
        <p className="text-muted-fg text-lg mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary text-primary-fg font-semibold text-base hover:bg-primary-hover active:translate-y-[1px] transition-all duration-150"
          >
            <Home size={16} strokeWidth={1.75} />
            Go home
          </Link>
          <Link
            href="/quick"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border-2 border-primary text-primary font-semibold text-base hover:bg-primary/5 transition-all duration-150"
          >
            <Search size={16} strokeWidth={1.75} />
            Try Quick Export
          </Link>
        </div>
      </div>
    </div>
  );
}