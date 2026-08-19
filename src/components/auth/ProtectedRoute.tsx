import { getSessionUser, hasPermission, hasRole } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

/**
 * Componente para proteger rutas basado en permisos
 * 
 * USO:
 * ```tsx
 * import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
 * 
 * export default async function AdminPage() {
 *   return (
 *     <ProtectedRoute permission="admin.access">
 *       <div>Contenido solo para administradores</div>
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  fallback?: ReactNode;
  redirectTo?: string;
}

export async function ProtectedRoute({
  children,
  permission,
  role,
  fallback,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const user = await getSessionUser();

  // Si no hay usuario, redirigir al login
  if (!user) {
    redirect(redirectTo);
  }

  // Verificar permiso si se especificó
  if (permission && !hasPermission(user, permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-red-900">
            Acceso Denegado
          </h2>
          <p className="mt-2 text-sm text-red-700">
            No tienes permisos para acceder a esta página.
          </p>
          <p className="mt-1 text-xs text-red-600">
            Permiso requerido: <code className="rounded bg-red-100 px-1">{permission}</code>
          </p>
        </div>
      </div>
    );
  }

  // Verificar rol si se especificó
  if (role && !hasRole(user, role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-amber-900">
            Rol Requerido
          </h2>
          <p className="mt-2 text-sm text-amber-700">
            Esta página está restringida a usuarios con rol específico.
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Rol requerido: <code className="rounded bg-amber-100 px-1">{role}</code>
          </p>
        </div>
      </div>
    );
  }

  // Usuario tiene los permisos necesarios
  return <>{children}</>;
}

/**
 * Componente para mostrar contenido solo si el usuario tiene un permiso
 * 
 * USO:
 * ```tsx
 * import { ShowIfPermission } from "@/components/auth/ProtectedRoute";
 * 
 * export default async function Dashboard() {
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       
 *       <ShowIfPermission permission="users.create">
 *         <button>Crear Usuario</button>
 *       </ShowIfPermission>
 *     </div>
 *   );
 * }
 * ```
 */
interface ShowIfPermissionProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

export async function ShowIfPermission({
  children,
  permission,
  fallback,
}: ShowIfPermissionProps) {
  const user = await getSessionUser();

  if (!user || !hasPermission(user, permission)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Componente para mostrar contenido solo si el usuario tiene un rol
 * 
 * USO:
 * ```tsx
 * import { ShowIfRole } from "@/components/auth/ProtectedRoute";
 * 
 * export default async function Dashboard() {
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       
 *       <ShowIfRole role="Administrador">
 *         <a href="/admin">Panel de Administración</a>
 *       </ShowIfRole>
 *     </div>
 *   );
 * }
 * ```
 */
interface ShowIfRoleProps {
  children: ReactNode;
  role: string;
  fallback?: ReactNode;
}

export async function ShowIfRole({
  children,
  role,
  fallback,
}: ShowIfRoleProps) {
  const user = await getSessionUser();

  if (!user || !hasRole(user, role)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Componente para mostrar información del usuario autenticado
 * 
 * USO:
 * ```tsx
 * import { UserInfo } from "@/components/auth/ProtectedRoute";
 * 
 * export default async function Header() {
 *   return (
 *     <header>
 *       <UserInfo />
 *     </header>
 *   );
 * }
 * ```
 */
export async function UserInfo() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white font-semibold">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-gray-700">
          {user.roles.join(", ")}
        </p>
        <p className="text-xs text-gray-500">
          {user.permissions.length} permisos
        </p>
      </div>
    </div>
  );
}

/**
 * Badge de rol del usuario
 */
export async function RoleBadge() {
  const user = await getSessionUser();

  if (!user || user.roles.length === 0) {
    return null;
  }

  const roleColors: Record<string, string> = {
    Administrador: "bg-red-100 text-red-800 border-red-200",
    Desarrollador: "bg-blue-100 text-blue-800 border-blue-200",
    Gestor: "bg-purple-100 text-purple-800 border-purple-200",
    Usuario: "bg-gray-100 text-gray-800 border-gray-200",
    Soporte: "bg-green-100 text-green-800 border-green-200",
    Auditor: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  return (
    <div className="flex flex-wrap gap-1">
      {user.roles.map((role) => (
        <span
          key={role}
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            roleColors[role] || "bg-gray-100 text-gray-800 border-gray-200"
          }`}
        >
          {role}
        </span>
      ))}
    </div>
  );
}
