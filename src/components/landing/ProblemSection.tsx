"use client";

const problems = [
  {
    number: "01",
    title: "Manual Data Entry",
    description: "Typing names, IDs, dates, and contact information one record at a time.",
  },
  {
    number: "02",
    title: "Repetitive Work",
    description: "Processing dozens or hundreds of student cards takes valuable administrative time.",
  },
  {
    number: "03",
    title: "Data Errors",
    description: "Manual copying makes spelling mistakes, missing fields, and inconsistent formatting more likely.",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="py-16 md:py-24" aria-labelledby="problem-heading">
      <div className="max-w-6xl mx-auto px-6">
        <header className="max-w-2xl mx-auto mb-16 text-center">
          <h2 id="problem-heading" className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.1] mb-4">
            Stop typing student data by hand
          </h2>
          <p className="text-lg text-muted-fg leading-relaxed">
            Managing student records from ID cards and forms can mean hours of repetitive data entry, copying, checking, and formatting.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem) => (
            <article key={problem.number} className="bg-card border border-border rounded-xl p-6">
              <div className="font-mono text-4xl md:text-5xl font-bold text-primary/30 mb-4 tracking-tighter">
                {problem.number}
              </div>
              <h3 className="font-display text-xl font-bold tracking-tight text-foreground mb-2">
                {problem.title}
              </h3>
              <p className="text-muted-fg leading-relaxed">{problem.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}