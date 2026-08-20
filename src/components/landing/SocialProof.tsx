"use client";

import { Users, Building2, Award } from "lucide-react";

const stats = [
  { value: "50K+", label: "Students processed", icon: Users },
  { value: "200+", label: "Schools onboarded", icon: Building2 },
  { value: "99.2%", label: "Extraction accuracy", icon: Award },
];

export function SocialProof() {
  return (
    <section className="py-16 md:py-24 bg-muted/30" aria-labelledby="social-proof-heading">
      <div className="max-w-6xl mx-auto px-6">
        <header className="max-w-2xl mx-auto mb-16">
          <h2 id="social-proof-heading" className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.1] text-center mb-4">
            Trusted by school administrators nationwide
          </h2>
          <p className="text-lg text-muted-fg leading-relaxed text-center">
            From district offices to individual campuses, teams rely on accurate data every enrollment season.
          </p>
        </header>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mb-16">
          {stats.map((stat, index) => (
            <article key={stat.value} className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon size={24} strokeWidth={1.75} className="text-primary" />
              </div>
              <div className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-none">
                {stat.value}
              </div>
              <p className="mt-2 text-muted-fg font-medium">{stat.label}</p>
            </article>
          ))}
        </div>

        {/* Trust indicators - logos */}
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-muted-fg text-center mb-8">
            Schools & districts using School ID Extractor
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 hover:opacity-100 transition-opacity duration-300">
            <span className="font-mono text-sm text-muted-fg">Delhi Public School</span>
            <span className="font-mono text-sm text-muted-fg">Kendriya Vidyalaya</span>
            <span className="font-mono text-sm text-muted-fg">DAV Public Schools</span>
            <span className="font-mono text-sm text-muted-fg">Ryan International</span>
            <span className="font-mono text-sm text-muted-fg">Podar Education</span>
            <span className="font-mono text-sm text-muted-fg">Amity International</span>
          </div>
        </div>
      </div>
    </section>
  );
}