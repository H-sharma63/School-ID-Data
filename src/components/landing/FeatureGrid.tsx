"use client";

const features = [
  {
    icon: "📁",
    title: "Batch Upload",
    description: "Process multiple student documents without entering them one by one.",
  },
  {
    icon: "📋",
    title: "Organized Student Roster",
    description: "Keep extracted student information structured and searchable.",
  },
  {
    icon: "🔍",
    title: "OCR Extraction",
    description: "Automatically extract information from student ID cards and documents.",
  },
  {
    icon: "📊",
    title: "Excel Export",
    description: "Turn processed records into a clean spreadsheet for school administration.",
  },
  {
    icon: "✅",
    title: "Smart Review",
    description: "Quickly identify records that may need manual verification.",
  },
  {
    icon: "⚡",
    title: "Simple Workflow",
    description: "Designed to keep the process straightforward from upload to export.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-16 md:py-24 bg-muted/30" aria-labelledby="features-heading">
      <div className="max-w-6xl mx-auto px-6">
        <header className="max-w-2xl mx-auto mb-16 text-center">
          <h2 id="features-heading" className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.1] mb-4">
            Everything you need to digitize student records
          </h2>
          <p className="text-lg text-muted-fg leading-relaxed">
            Simple tools for the complete journey from document to spreadsheet.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <article key={feature.title} className="bg-card border border-border rounded-xl p-6 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-display text-xl font-bold tracking-tight text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-fg leading-relaxed">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}