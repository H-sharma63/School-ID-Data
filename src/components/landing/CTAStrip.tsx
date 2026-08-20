"use client";

import Link from "next/link";

interface CTAStripProps {
  onLoginClick: () => void;
}

export function CTAStrip({ onLoginClick }: CTAStripProps) {
  return (
    <section className="py-16 md:py-24 bg-primary/5" aria-labelledby="cta-heading">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 id="cta-heading" className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.1] mb-4">
            Ready to stop typing enrollment forms?
          </h2>
          <p className="text-lg text-muted-fg leading-relaxed mb-8">
            Upload your first batch today. First 100 students free — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onLoginClick}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-fg font-semibold text-base hover:bg-primary-hover active:translate-y-[1px] transition-all duration-150 w-full sm:w-auto"
            >
              Start extracting free
            </button>
            <Link
              href="/quick"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border-2 border-primary text-primary font-semibold text-base hover:bg-primary/5 transition-all duration-150 w-full sm:w-auto"
            >
              Try Quick Export
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}