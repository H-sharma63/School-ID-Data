"use client";

import Link from "next/link";

interface HeroProps {
  onLoginClick: () => void;
}

export function Hero({ onLoginClick }: HeroProps) {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32" aria-labelledby="hero-heading">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy - not centered, left-aligned */}
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-widest text-primary mb-6">
              School ID Extractor
            </p>
            <h1
              id="hero-heading"
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05] mb-6"
            >
              Read handwritten enrollment forms in minutes, not hours
            </h1>
            <p className="text-lg md:text-xl text-muted-fg leading-relaxed mb-8 max-w-lg">
              Upload photos of student forms. AI extracts every field. Review, edit, export to Excel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
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

          {/* Right: Visual - the "product shot" */}
          <div className="relative">
            <div className="relative aspect-[4/3] bg-card border border-border rounded-2xl overflow-hidden">
              {/* Simulated product screenshot */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-muted/10" />

              {/* Device frame */}
              <div className="relative h-full w-full max-w-md mx-auto p-2">
                <div className="h-full bg-background border border-border/50 rounded-xl overflow-hidden shadow-2xl">
                  {/* Top bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                    <div className="w-3 h-3 rounded-full bg-danger/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                    <div className="flex-1" />
                    <span className="font-mono text-xs text-muted-fg">dashboard.school-id-extractor.app</span>
                  </div>

                  {/* Content area */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold text-foreground">Class 10-B • 2026-27</h3>
                      <span className="px-2 py-1 text-xs font-mono font-medium bg-primary/10 text-primary rounded">42 students</span>
                    </div>

                    {/* Table preview */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm font-mono">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-2 text-muted-fg">Admission</th>
                            <th className="text-left py-2 text-muted-fg">Student Name</th>
                            <th className="text-left py-2 text-muted-fg">Father</th>
                            <th className="text-left py-2 text-muted-fg">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          <tr className="hover:bg-muted/30 transition-colors">
                            <td className="py-2 text-foreground">ADM-1042</td>
                            <td className="py-2 text-foreground font-medium">Aarav Sharma</td>
                            <td className="py-2 text-muted-fg">Rajesh Sharma</td>
                            <td className="py-2"><span className="px-2 py-0.5 text-xs font-mono bg-success-bg text-success rounded">Ready</span></td>
                          </tr>
                          <tr className="hover:bg-muted/30 transition-colors">
                            <td className="py-2 text-foreground">ADM-1043</td>
                            <td className="py-2 text-foreground font-medium">Priya Patel</td>
                            <td className="py-2 text-muted-fg">Amit Patel</td>
                            <td className="py-2"><span className="px-2 py-0.5 text-xs font-mono bg-warning-bg text-warning rounded">Review</span></td>
                          </tr>
                          <tr className="hover:bg-muted/30 transition-colors">
                            <td className="py-2 text-foreground">ADM-1044</td>
                            <td className="py-2 text-foreground font-medium">Arjun Singh</td>
                            <td className="py-2 text-muted-fg">Vikram Singh</td>
                            <td className="py-2"><span className="px-2 py-0.5 text-xs font-mono bg-success-bg text-success rounded">Ready</span></td>
                          </tr>
                          <tr className="hover:bg-muted/30 transition-colors opacity-60">
                            <td className="py-2 text-muted-fg">ADM-1045</td>
                            <td className="py-2 text-muted-fg">...</td>
                            <td className="py-2 text-muted-fg">...</td>
                            <td className="py-2"><span className="px-2 py-0.5 text-xs font-mono bg-muted text-muted-fg rounded">38 more</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Export bar */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
                      <button className="px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors rounded-lg">
                        CSV
                      </button>
                      <button className="px-4 py-2 text-sm font-semibold bg-primary text-primary-fg hover:bg-primary-hover transition-colors rounded-lg">
                        Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating accent element */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 rotate-3" />
              <div className="absolute -top-4 -left-4 w-16 h-16 rounded-xl bg-warning/10 border border-warning/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}