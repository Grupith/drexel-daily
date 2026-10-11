"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "size-10 text-drexel-subtle cursor-pointer hover:bg-drexel-soft dark:hover:bg-drexel-soft",
        "hover:text-drexel-subtle focus-visible:outline-2 focus-visible:outline-solid",
        "focus-visible:outline-drexel-focus focus-visible:outline-offset-3",
        className,
      )}
      aria-label="Toggle light and dark mode"
      title="Toggle light and dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="dark:hidden" aria-hidden="true" />
      <Sun className="hidden dark:block" aria-hidden="true" />
    </Button>
  );
}
