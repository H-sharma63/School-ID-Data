"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, User, Building2, Phone } from "lucide-react";
import type { Student } from "@/types";

interface SearchResultStudent extends Student {
  schoolId: string;
  schoolName: string;
  className: string;
  sectionName: string;
  academicYear: string;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultStudent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.students || []);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const goToStudent = (s: SearchResultStudent) => {
    const sp = new URLSearchParams();
    if (s.schoolId) sp.set("school", s.schoolId);
    if (s.className) sp.set("class", s.className);
    if (s.sectionName) sp.set("section", s.sectionName);
    if (s.academicYear) sp.set("year", s.academicYear);
    window.location.href = `/?${sp.toString()}`;
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-fg">
          {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} strokeWidth={2} />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Global search by name, admission no, or phone..."
          className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-card text-[0.9375rem] text-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors shadow-sm"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {results.length === 0 && !isSearching ? (
            <div className="px-5 py-6 text-center text-[0.875rem] text-muted-fg">
              No students found for "{query}".
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-[50vh] overflow-y-auto thin-scrollbar">
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => goToStudent(s)}
                    className="w-full px-5 py-3 flex items-start justify-between hover:bg-muted/40 transition-colors text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-[0.9375rem]">{s.studentName}</span>
                        {s.admissionNo && (
                          <span className="font-mono text-[0.6875rem] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-fg">
                            {s.admissionNo}
                          </span>
                        )}
                      </div>

                      {/* Parents */}
                      {(s.fatherName || s.motherName) && (
                        <div className="mt-0.5 text-[0.8125rem] text-muted-fg flex items-center gap-1.5">
                          <User size={13} className="opacity-70" />
                          <span className="truncate">
                            {[s.fatherName && `F: ${s.fatherName}`, s.motherName && `M: ${s.motherName}`]
                              .filter(Boolean)
                              .join("  •  ")}
                          </span>
                        </div>
                      )}

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-muted-fg">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} />
                          <span>{s.schoolName} — Class {s.className} / {s.sectionName}</span>
                        </div>
                        {s.mobileNumber && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={13} />
                            <span className="font-mono">{s.mobileNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
