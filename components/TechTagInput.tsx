"use client";
import { useEffect, useMemo, useState } from "react";
import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Technology } from "@/lib/types";

interface Props {
  value: string[]; // technology names currently tagged
  onChange: (names: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Tag input for technologies (AWS, Kafka, Terraform, ...). Suggests from
 * the existing technology catalog as you type, and lets you add a new one
 * that isn't in the list yet — the backend resolves aliases/dupes.
 */
export function TechTagInput({ value, onChange, disabled, placeholder }: Props) {
  const [catalog, setCatalog] = useState<Technology[]>([]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetch("/api/technologies").then((r) => r.json()).then(setCatalog);
  }, []);

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return [];
    const tagged = new Set(value.map((v) => v.toLowerCase()));
    return catalog
      .filter((t) => t.name.toLowerCase().includes(q) && !tagged.has(t.name.toLowerCase()))
      .slice(0, 8);
  }, [input, catalog, value]);

  const addTag = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...value, trimmed]);
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (name: string) => {
    onChange(value.filter((v) => v !== name));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((name) => (
          <Badge key={name} variant="secondary" className="gap-1">
            {name}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(name)}
                className="hover:text-destructive"
                aria-label={`Remove ${name}`}
              >
                <XIcon className="size-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {!disabled && (
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(input);
              } else if (e.key === "Backspace" && !input && value.length) {
                removeTag(value[value.length - 1]);
              }
            }}
            placeholder={placeholder ?? "Add a technology…"}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                  onMouseDown={(e) => { e.preventDefault(); addTag(s.name); }}
                >
                  {s.name}
                  <span className="text-muted-foreground text-xs ml-2">{s.category.replace("_", " ")}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
