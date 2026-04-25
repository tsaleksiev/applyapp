"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
}

export function MarkdownEditor({ value, onChange, placeholder, minRows = 6 }: Props) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!preview ? "default" : "outline"}
          size="sm"
          onClick={() => setPreview(false)}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant={preview ? "default" : "outline"}
          size="sm"
          onClick={() => setPreview(true)}
        >
          Preview
        </Button>
      </div>
      {preview ? (
        <div className="min-h-[120px] rounded-md border p-3 prose prose-sm dark:prose-invert max-w-none">
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic">Nothing to preview.</p>
          )}
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className="font-mono text-sm"
        />
      )}
    </div>
  );
}

export function MarkdownView({ content }: { content: string | null }) {
  if (!content) return <p className="text-muted-foreground italic text-sm">No content.</p>;
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
