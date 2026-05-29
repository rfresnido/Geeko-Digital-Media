"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Target,
  History,
  Settings,
  Zap,
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
    <aside className="flex w-72 flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/50">
      {/* Logo */}
      <div className="flex h-20 items-center gap-4 px-6">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl animated-gradient text-white font-bold text-lg shadow-lg shadow-teal-200">
            3n
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"></div>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-geeko-navy to-geeko-teal bg-clip-text text-transparent">
            3nzo
          </h1>
          <p className="text-xs text-slate-400 font-medium">Geeko Digital Media</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </p>
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
              {item.href === "/chat" && (
                <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-4">
        <div className="rounded-2xl bg-gradient-to-br from-geeko-navy to-slate-800 p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Quick Action</p>
              <p className="text-xs text-white/60">AI-powered commands</p>
            </div>
          </div>
          <Link
            href="/chat"
            className="block w-full rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2.5 text-center text-sm font-medium transition-all duration-200"
          >
            Ask 3nzo anything →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200/50 p-4">
        <Link href="/settings" className="nav-link">
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
