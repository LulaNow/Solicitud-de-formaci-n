"use client";

import { useSession } from "next-auth/react";
import { Bell, User } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const roles = (user as Record<string, unknown>)?.roles as string[] | undefined;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="rounded-sm p-1.5 text-gray-500 transition-colors hover:bg-surface-alt hover:text-gray-700">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <p className="font-medium text-gray-800">{user?.name || "Usuario"}</p>
            <p className="text-xs text-gray-500">{roles?.[0] || "Sin rol"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
