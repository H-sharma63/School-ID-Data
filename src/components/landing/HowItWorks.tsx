"use client";

const steps = [
  {
    number: "01",
    title: "UPLOAD",
    description: "Upload JPGs, PNGs, or PDFs containing student ID cards.",
  },
  {
    number: "02",
    title: "EXTRACT",
    description: "OCR reads the information from each document.",
  },
  {
    number: "03",
    title: "REVIEW",
    description: "Correct anything that needs attention before export.",
  },
  {
    number: "04",
    title: "EXPORT",
    description: "Download an organized Excel-ready roster.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-muted/30" aria-labelledby="how-it-works-heading">
      <div className="max-w-6xl mx-auto px-6">
        <header className="max-w-2xl mx-auto mb-16 text-center">
          <h2 id="how-it-works-heading" className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.1] mb-4">
            From ID cards to a clean roster in minutes
          </h2>
          <p className="text-lg text-muted-fg leading-relaxed">
            A four-step workflow designed around the way schools actually work.
          </p>
        </header>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <article key={step.number} className="relative">
              <div className="absolute -left-4 top-0 font-mono text-5xl md:text-6xl font-bold text-primary/20 tracking-tighter">
                {step.number}
              </div>
              <div className="pl-8">
                <h3 className="font-display text-xl font-bold tracking-tight text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-fg leading-relaxed">{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}