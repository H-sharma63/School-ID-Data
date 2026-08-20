"use client";

export function BeforeAfter() {
  return (
    <section id="before-after" className="py-16 md:py-24" aria-labelledby="before-after-heading">
      <div className="max-w-6xl mx-auto px-6">
        <header className="max-w-2xl mx-auto mb-16 text-center">
          <h2 id="before-after-heading" className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.1] mb-4">
            From messy documents to organized data
          </h2>
          <p className="text-lg text-muted-fg leading-relaxed">
            See the transformation from raw ID cards to a clean, actionable roster.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* BEFORE */}
          <article className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="px-3 py-1 text-xs font-mono font-medium bg-danger/10 text-danger rounded uppercase tracking-wider">
                Before
              </span>
              <span className="text-sm text-muted-fg">Manual entry chaos</span>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-muted/50 border border-border/50 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-danger">ADM-2401</span>
                  <span className="font-medium text-foreground">Aarav Sharma</span>
                  <span className="text-muted-fg">8-A</span>
                  <span className="text-muted-fg">A</span>
                  <span className="px-2 py-1 text-xs font-mono bg-warning-bg text-warning rounded">Needs review</span>
                </div>
                <div className="flex items-center gap-3 text-sm opacity-60">
                  <span className="font-mono text-muted-fg">ADM-2402</span>
                  <span className="text-muted-fg">Ananya Singh</span>
                  <span className="text-muted-fg">8-B</span>
                  <span className="text-muted-fg">B</span>
                  <span className="px-2 py-1 text-xs font-mono bg-muted text-muted-fg rounded">?</span>
                </div>
                <div className="flex items-center gap-3 text-sm opacity-60">
                  <span className="font-mono text-muted-fg">ADM-2403</span>
                  <span className="text-muted-fg">Rohan Kumar</span>
                  <span className="text-muted-fg">9-A</span>
                  <span className="text-muted-fg">A</span>
                  <span className="px-2 py-1 text-xs font-mono bg-danger-bg text-danger rounded">Error</span>
                </div>
              </div>
              <p className="text-xs text-muted-fg text-center">
                Inconsistent formats • Missing fields • Manual errors
              </p>
            </div>
          </article>

          {/* AFTER */}
          <article className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="px-3 py-1 text-xs font-mono font-medium bg-success/10 text-success rounded uppercase tracking-wider">
                After
              </span>
              <span className="text-sm text-muted-fg">Clean roster ready</span>
            </div>
            <div className="p-8 space-y-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">Student Name</th>
                    <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">Class</th>
                    <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">Section</th>
                    <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 font-medium text-foreground">Aarav Sharma</td>
                    <td className="py-2 text-foreground">8</td>
                    <td className="py-2 text-foreground">A</td>
                    <td className="py-2"><span className="px-2 py-1 text-xs font-mono bg-success-bg text-success rounded">Verified</span></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 font-medium text-foreground">Ananya Singh</td>
                    <td className="py-2 text-foreground">8</td>
                    <td className="py-2 text-foreground">B</td>
                    <td className="py-2"><span className="px-2 py-1 text-xs font-mono bg-success-bg text-success rounded">Verified</span></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 font-medium text-foreground">Rohan Kumar</td>
                    <td className="py-2 text-foreground">9</td>
                    <td className="py-2 text-foreground">A</td>
                    <td className="py-2"><span className="px-2 py-1 text-xs font-mono bg-warning-bg text-warning rounded">Needs review</span></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 font-medium text-foreground">Diya Verma</td>
                    <td className="py-2 text-foreground">9</td>
                    <td className="py-2 text-foreground">B</td>
                    <td className="py-2"><span className="px-2 py-1 text-xs font-mono bg-success-bg text-success rounded">Verified</span></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 font-medium text-foreground">Kabir Mehta</td>
                    <td className="py-2 text-foreground">8</td>
                    <td className="py-2 text-foreground">A</td>
                    <td className="py-2"><span className="px-2 py-1 text-xs font-mono bg-success-bg text-success rounded">Verified</span></td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-success text-center font-medium mt-2">
                Export-ready • Consistent • Searchable
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}