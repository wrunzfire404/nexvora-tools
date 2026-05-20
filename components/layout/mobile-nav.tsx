"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Wand2 } from "lucide-react";
import {
  Image,
  ZoomIn,
  Expand,
  Sun,
  Camera,
  Video,
  Move,
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
  Shield,
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
  Shield,
};

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-4 bg-card border-b border-border">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-accent min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2 ml-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nexlogo.png" alt="Nexvora" className="w-7 h-7 rounded-lg" />
          <span className="font-semibold">Nexvora</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
          <nav className="fixed top-14 left-0 right-0 bottom-0 overflow-y-auto bg-card p-4">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = pathname === item.href;
                const isComingSoon = "comingSoon" in item && item.comingSoon;

                if (isComingSoon) {
                  return (
                    <Link
                      key={item.href}
                      href="/coming-soon"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground/50 hover:text-muted-foreground min-h-[44px]"
                    >
                      {Icon && <Icon className="w-5 h-5 shrink-0" />}
                      <div>
                        <div className="flex items-center gap-2">
                          {item.title}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Soon</span>
                        </div>
                      </div>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors min-h-[44px]",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="w-5 h-5 shrink-0" />}
                    <div>
                      <div>{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
