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
                <Link
                  key={item.title}
                  href="/coming-soon"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/30 transition-colors"
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                  <span>{item.title}</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Soon</span>
                </Link>
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
      <div className="p-4 border-t border-border space-y-3">
        {/* Donate */}
        <a
          href="https://saweria.co/wrunzfire"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
        >
          <span className="text-sm">☕</span>
          <span className="text-[11px] text-amber-400 font-medium">Traktir Kopi</span>
        </a>

        {/* Social */}
        <div className="flex items-center justify-center gap-3">
          <a href="https://web.facebook.com/rezakimel" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Facebook">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="https://instagram.com/rzrenal" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Instagram @rzrenal">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="https://www.threads.com/@rzrenal" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Threads @rzrenal">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.261 1.332-3.07.88-.77 2.111-1.237 3.558-1.35 1.06-.083 2.04.008 2.942.27.022-.94-.093-1.79-.343-2.525-.39-1.147-1.09-1.794-2.208-2.037-1.478-.322-2.813.076-3.334.335l-.834-1.833c.712-.33 2.275-.812 4.09-.587 1.706.211 2.94 1.05 3.548 2.394.419.924.594 2.062.52 3.39.612.298 1.155.66 1.62 1.088 1.12 1.028 1.74 2.457 1.795 4.127.065 2.003-.62 3.727-2.033 5.12C17.856 23.029 15.46 23.96 12.186 24zM9.15 15.22c.05.9.476 1.567 1.238 1.94.652.32 1.475.45 2.344.393 1.07-.058 1.91-.462 2.498-1.2.478-.6.814-1.387.997-2.343-1.227-.396-2.576-.464-3.937-.272-1.04.147-1.837.473-2.38.975-.497.457-.787 1.07-.76 1.507z"/></svg>
          </a>
          <a href="https://t.me/NexvoraTools" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Telegram">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          </a>
          <span className="text-[10px] text-muted-foreground">by Reza</span>
        </div>
      </div>
    </aside>
  );
}
