import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || resolvedTheme !== "light";

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute("content", isDark ? "#100e0c" : "#f4efe6");
  }, [isDark]);

  return (
    <button
      type="button"
      className="tap-target inline-flex items-center justify-center gap-2 px-1 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to ivory" : "Switch to night"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden font-mono text-[0.68rem] uppercase tracking-[0.16em] xl:inline">{isDark ? "Ivory" : "Night"}</span>
    </button>
  );
}
