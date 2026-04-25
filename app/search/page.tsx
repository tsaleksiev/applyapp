"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import type { SearchResult } from "@/lib/queries/search";

const TYPE_LABELS: Record<string, string> = {
  company: "Companies",
  application: "Applications",
  interview: "Interviews",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const grouped: Record<string, SearchResult[]> = {};
  for (const r of results) {
    (grouped[r.type] ??= []).push(r);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>

      <Input
        placeholder="Search across companies, applications, interviews…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          doSearch(e.target.value);
        }}
        className="text-base"
        autoFocus
      />

      {loading && <p className="text-muted-foreground text-sm">Searching…</p>}

      {searched && results.length === 0 && !loading && (
        <p className="text-muted-foreground text-sm">No results for &quot;{query}&quot;.</p>
      )}

      {Object.entries(grouped).map(([type, items]) => (
        <section key={type} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
            {TYPE_LABELS[type] ?? type} ({items.length})
          </h2>
          <div className="space-y-1">
            {items.map((r, i) => (
              <Link
                key={i}
                href={r.url}
                className="block border rounded-lg px-4 py-3 hover:bg-muted transition-colors"
              >
                <div className="font-medium">
                  {r.company_name}
                  {r.role_title && <span className="text-muted-foreground font-normal"> · {r.role_title}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {!searched && !loading && (
        <p className="text-muted-foreground text-sm">
          Type at least 2 characters to search. Searches company names, role titles, job descriptions, interview questions, and notes.
        </p>
      )}
    </div>
  );
}
