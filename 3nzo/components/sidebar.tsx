"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Target,
  History,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat with 3nzo", icon: MessageSquare },
  { href: "/campaigns", label: "Campaigns", icon: Target },
  { href: "/history", label: "Mutation Log", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-geeko-teal text-white font-bold">
          3N
        </div>
        <div>
          <h1 className="font-bold text-geeko-navy">3nzo</h1>
          <p className="text-xs text-muted-foreground">Geeko Digital Media</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nav-link",
                isActive && "nav-link-active"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Link href="/settings" className="nav-link">
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <div className="mt-4 rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">
            AI Engine: <span className="text-geeko-teal font-medium">GPT-4o</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Credits: <span className="text-geeko-orange font-medium">$9.00</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
