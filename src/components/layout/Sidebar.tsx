"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, Inbox, Shield, Users, UserCog,
  Key, Menu as MenuIcon, ChevronDown, LogOut, Loader2,
  Settings, Globe,
} from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, FileText, Inbox, Shield, Users, UserCog, Key, Menu: MenuIcon,
  Settings, Globe,
};

type MenuItem = {
  id: string;
  label: string;
  labelEs: string | null;
  icon: string | null;
  path: string | null;
  children: { id: string; label: string; labelEs: string | null; icon: string | null; path: string | null }[];
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: menuItems, isLoading } = trpc.menus.getForUser.useQuery();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function renderIcon(iconName: string | null, className?: string) {
    if (!iconName) return null;
    const Icon = iconMap[iconName];
    return Icon ? <Icon className={className} /> : null;
  }

  function isActive(path: string | null) {
    if (!path) return false;
    return pathname === path || pathname.startsWith(path + "/");
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-white">
      <div className="flex h-16 items-center justify-center border-b border-border px-4">
        <Link href="/dashboard">
          <Image src="/log.png" alt="NADRO" width={120} height={36} priority />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          </div>
        ) : (
          <ul className="space-y-1">
            {menuItems?.map((item: MenuItem) =>
              item.children.length > 0 ? (
                <li key={item.id}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-alt",
                      item.children.some((c) => isActive(c.path)) && "text-brand-600"
                    )}
                  >
                    {renderIcon(item.icon, "h-4 w-4")}
                    <span className="flex-1 text-left">{item.labelEs || item.label}</span>
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform", expanded[item.id] && "rotate-180")}
                    />
                  </button>
                  {(expanded[item.id] || item.children.some((c) => isActive(c.path))) && (
                    <ul className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={child.path || "#"}
                            className={cn(
                              "flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors hover:bg-surface-alt",
                              isActive(child.path) ? "bg-brand-50 font-medium text-brand-700" : "text-gray-600"
                            )}
                          >
                            {renderIcon(child.icon, "h-3.5 w-3.5")}
                            <span>{child.labelEs || child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                <li key={item.id}>
                  <Link
                    href={item.path || "#"}
                    className={cn(
                      "flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-alt",
                      isActive(item.path) ? "bg-brand-50 text-brand-700" : "text-gray-700"
                    )}
                  >
                    {renderIcon(item.icon, "h-4 w-4")}
                    <span>{item.labelEs || item.label}</span>
                  </Link>
                </li>
              )
            )}
          </ul>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
