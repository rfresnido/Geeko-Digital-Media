"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Target,
  History,
  Settings,
  Zap,
  Menu,
  X,
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
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between bg-white/90 backdrop-blur-xl border-b border-slate-200/50 px-4 md:hidden">
        <Image
          src="/geeko-logo.png"
          alt="Geeko Digital Media"
          width={100}
          height={40}
          className="object-contain"
          priority
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 flex w-64 md:w-56 flex-col bg-white/95 md:bg-white/70 backdrop-blur-xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-4 border-b border-slate-100">
          <Image
            src="/geeko-logo.png"
            alt="Geeko Digital Media"
            width={120}
            height={50}
            className="object-contain"
            priority
          />
          {/* Close button for mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 p-3">
          <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu
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
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.href === "/chat" && (
                  <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="p-3">
          <div className="rounded-xl bg-gradient-to-br from-geeko-navy to-slate-800 p-3 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold">Quick Action</p>
                <p className="text-[10px] text-white/60">AI commands</p>
              </div>
            </div>
            <Link
              href="/chat"
              className="block w-full rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur px-3 py-1.5 text-center text-xs font-medium transition-all duration-200"
            >
              Ask 3nzo →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200/50 p-3">
          <Link href="/settings" className="nav-link">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Spacer for mobile header */}
      <div className="h-14 md:hidden" />
    </>
  );
}
