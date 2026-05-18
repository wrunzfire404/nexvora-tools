"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Image,
  ZoomIn,
  Expand,
  Sun,
  Camera,
  Video,
  Move,
  Wand2,
  Shapes,
  ListTodo,
  History,
  Sparkles,
  BarChart3,
  ShoppingBag,
  Package,
  Layers,
  Clapperboard,
  MonitorPlay,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
  ZoomIn,
  Expand,
  Sun,
  Camera,
  Video,
  Move,
  Wand2,
  Shapes,
  ListTodo,
  History,
  Sparkles,
  BarChart3,
  ShoppingBag,
  Package,
  Layers,
  Clapperboard,
  MonitorPlay,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Link href="/generate" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nexlogo.png" alt="Nexvora" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold text-lg">Nexvora</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href;
            const isComingSoon = "comingSoon" in item && item.comingSoon;

            if (isComingSoon) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed"
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                  <span>{item.title}</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Soon</span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Powered by Magnific API
        </p>
      </div>
    </aside>
  );
}
