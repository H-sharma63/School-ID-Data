"use client";

import { FaXTwitter, FaGithub } from "react-icons/fa6";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-12" role="contentinfo">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-fg">
            School ID Extractor — Built for school administrators
          </p>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="https://github.com/H-sharma63" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-fg hover:text-foreground transition-colors">
              <FaGithub size={14} />
            </Link>
            <Link href="https://x.com/harshit1060" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-fg hover:text-foreground transition-colors">
              <FaXTwitter size={14} />
            </Link>
            <Link href="/privacy" className="text-muted-fg hover:text-foreground transition-colors">Privacy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}