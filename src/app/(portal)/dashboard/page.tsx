"use client";

import { trpc } from "@/lib/trpc/client";
import { useSession } from "next-auth/react";
import {
  FileText,
  Inbox,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: stats } = trpc.requests.stats.useQuery();
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anime: typeof import("animejs");
    import("animejs").then((mod) => {
      anime = mod;
      if (cardsRef.current) {
        anime.default({
          targets: cardsRef.current.children,
          opacity: [0, 1],
          translateY: [20, 0],
          delay: ((_el: Element, i: number) => i * 100) as unknown as number,
          duration: 600,
          easing: "easeOutCubic",
        });
      }
    });
  }, [stats]);

  const user = session?.user;
  const roles = (user as Record<string, unknown>)?.roles as
    | string[]
    | undefined;

  const cards = [
    {
      label: "Total Peticiones",
      value: stats?.total ?? 0,
      icon: Inbox,
      color: "text-brand-600 bg-brand-50",
    },
    {
      label: "Pendientes",
      value: stats?.pending ?? 0,
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "En Proceso",
      value: stats?.inProgress ?? 0,
      icon: AlertCircle,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Aprobadas",
      value: stats?.approved ?? 0,
      icon: CheckCircle,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Rechazadas",
      value: stats?.rejected ?? 0,
      icon: XCircle,
      color: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.name || "Usuario"}
        </h1>
        <p className="text-sm text-gray-500">
          {roles?.[0] || "Sin rol"} — Panel de control
        </p>
      </div>

      <div
        ref={cardsRef}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-sm border border-border bg-white p-4 opacity-0"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-sm ${card.color}`}
            >
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/forms/new"
              className="flex items-center gap-3 rounded-sm border border-border p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <FileText className="h-5 w-5 text-brand-500" />
              <span className="text-sm font-medium">Nuevo Formulario</span>
            </Link>
            <Link
              href="/requests"
              className="flex items-center gap-3 rounded-sm border border-border p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <Inbox className="h-5 w-5 text-brand-500" />
              <span className="text-sm font-medium">Ver Peticiones</span>
            </Link>
            {roles?.includes("Administrador") && (
              <Link
                href="/admin/users"
                className="flex items-center gap-3 rounded-sm border border-border p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <Users className="h-5 w-5 text-brand-500" />
                <span className="text-sm font-medium">Gestionar Usuarios</span>
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Información del Sistema
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Versión</dt>
              <dd className="font-medium">1.0.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Ambiente</dt>
              <dd className="font-medium">Desarrollo</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Seguridad</dt>
              <dd className="font-medium text-green-600">
                AES-256-GCM + Custom Base85
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Base de Datos</dt>
              <dd className="font-medium text-green-600">PostgreSQL ✓</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
