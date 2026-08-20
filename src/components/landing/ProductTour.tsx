"use client";

const students = [
  { admission: "ADM-2401", name: "Aarav Sharma", father: "Rajesh Sharma", class: "8", section: "A", dob: "14/02/2012", mobile: "98XXXX1021", status: "Verified" },
  { admission: "ADM-2402", name: "Ananya Singh", father: "Vikram Singh", class: "8", section: "B", dob: "23/05/2012", mobile: "98XXXX1022", status: "Verified" },
  { admission: "ADM-2403", name: "Rohan Kumar", father: "Sanjay Kumar", class: "9", section: "A", dob: "09/07/2012", mobile: "98XXXX1023", status: "Review" },
  { admission: "ADM-2404", name: "Diya Verma", father: "Amit Verma", class: "9", section: "B", dob: "18/09/2012", mobile: "98XXXX1024", status: "Verified" },
  { admission: "ADM-2405", name: "Kabir Mehta", father: "Nitin Mehta", class: "8", section: "A", dob: "02/11/2012", mobile: "98XXXX1025", status: "Verified" },
];

export function ProductTour() {
  return (
    <section id="workflow" className="py-16 md:py-24" aria-labelledby="product-tour-heading">
      <div className="max-w-6xl mx-auto px-6">
        <header className="max-w-2xl mx-auto mb-12 text-center">
          <h2 id="product-tour-heading" className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.1] mb-4">
            Your student data, organized automatically
          </h2>
          <p className="text-lg text-muted-fg leading-relaxed">
            A clean roster gives administrators one reliable place to review extracted records.
          </p>
        </header>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Processing header */}
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 text-xs font-mono font-medium bg-primary/10 text-primary rounded">Upload</span>
              <span className="px-3 py-1 text-xs font-mono font-medium bg-primary/10 text-primary rounded">Extract</span>
              <span className="px-3 py-1 text-xs font-mono font-medium bg-primary text-primary-fg rounded">Export Excel</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-fg">12 files ready</span>
              <span className="flex items-center gap-1.5 text-success font-medium">OCR ready</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-fg">Admission No.</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-fg">Student Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-fg">Father Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-fg">Class</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-fg">Section</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-fg">DOB</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-fg">Mobile</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-fg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student, index) => (
                  <tr key={student.admission} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-foreground">{student.admission}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-fg">{student.father}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{student.class}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{student.section}</td>
                    <td className="px-6 py-4 text-sm text-muted-fg">{student.dob}</td>
                    <td className="px-6 py-4 font-mono text-sm text-muted-fg">{student.mobile}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-mono font-medium rounded ${
                        student.status === "Verified"
                          ? "bg-success-bg text-success"
                          : "bg-warning-bg text-warning"
                      }`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export bar */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-end">
            <button className="px-6 py-3 text-sm font-semibold bg-primary text-primary-fg hover:bg-primary-hover transition-colors rounded-lg">
              Export Excel
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}