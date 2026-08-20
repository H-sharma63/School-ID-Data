"use client";

import { Shield, Zap, FileSpreadsheet, CheckCheck } from "lucide-react";

const props = [
  {
    icon: Zap,
    title: "Instant extraction",
    description: "Gemini Vision reads handwriting in seconds. Upload a photo, get structured data.",
  },
  {
    icon: CheckCheck,
    title: "Review with confidence",
    description: "Every field shows confidence level. Click to edit inline. Changes save automatically.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export to Excel",
    description: "One-click CSV for Photoshop batches, or formatted Excel with all student records.",
  },
  {
    icon: Shield,
    title: "Built for schools",
    description: "Hierarchical school → class → section organization. Year-end promotion wizard included.",
  },
];

export function ValueProps() {
  return (
    <section className="py-16 md:py-24 bg-muted/30" aria-labelledby="value-props-heading">
      <div className="max-w-6xl mx-auto px-6">
        <header className="text-center max-w-2xl mx-auto mb-12">
          <h2 id="value-props-heading" className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.1] mb-4">
            Everything you need to digitize enrollment
          </h2>
          <p className="text-lg text-muted-fg leading-relaxed">
            No complex setup. No manual entry. Just results.
          </p>
        </header>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {props.map((prop, index) => (
            <article
              key={prop.title}
              className="bg-card border border-border rounded-xl p-6 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <prop.icon size={20} strokeWidth={1.75} className="text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold tracking-tight text-foreground mb-2">
                {prop.title}
              </h3>
              <p className="text-muted-fg leading-relaxed">{prop.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}