"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/applications", label: "Applications" },
  { href: "/companies", label: "Companies" },
  { href: "/calendar", label: "Calendar" },
  { href: "/search", label: "Search" },
];

export function NavBar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link href="/" className="font-bold text-lg mr-4 text-primary">
            ApplyApp
          </Link>
          <nav className="flex gap-1">
            {links.map((l) => {
              const active =
                l.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </Button>
      </div>
    </header>
  );
}
