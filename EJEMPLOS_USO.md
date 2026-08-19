# 📚 Ejemplos de Uso - SSO OAuth 2.0

Ejemplos prácticos de cómo usar el sistema SSO en tu aplicación.

---

## 🔐 1. Proteger una Página Completa

### Ejemplo: Página de Administración

```tsx
// src/app/(portal)/admin/page.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default async function AdminPage() {
  return (
    <ProtectedRoute permission="admin.access">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <p>Solo usuarios con permiso "admin.access" pueden ver esto.</p>
      </div>
    </ProtectedRoute>
  );
}
```

### Ejemplo: Página Solo para Desarrolladores

```tsx
// src/app/(portal)/dev-tools/page.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default async function DevToolsPage() {
  return (
    <ProtectedRoute role="Desarrollador">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Herramientas de Desarrollo</h1>
        <p>Solo usuarios con rol "Desarrollador" pueden acceder.</p>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 👁️ 2. Mostrar/Ocultar Elementos según Permisos

### Ejemplo: Botones Condicionales

```tsx
// src/app/(portal)/users/page.tsx
import { ShowIfPermission } from "@/components/auth/ProtectedRoute";

export default async function UsersPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        
        {/* Solo mostrar botón si tiene permiso para crear usuarios */}
        <ShowIfPermission permission="users.create">
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Crear Usuario
          </button>
        </ShowIfPermission>
      </div>
      
      <div className="space-y-4">
        {/* Lista de usuarios */}
        <div className="border rounded p-4">
          <p>Usuario 1</p>
          
          {/* Solo mostrar botones de edición/eliminación si tiene permisos */}
          <div className="flex gap-2 mt-2">
            <ShowIfPermission permission="users.edit">
              <button className="text-blue-600">Editar</button>
            </ShowIfPermission>
            
            <ShowIfPermission permission="users.delete">
              <button className="text-red-600">Eliminar</button>
            </ShowIfPermission>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Ejemplo: Menú según Rol

```tsx
// src/components/layout/Sidebar.tsx
import { ShowIfRole } from "@/components/auth/ProtectedRoute";

export default async function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-white">
      <nav className="p-4 space-y-2">
        <a href="/dashboard" className="block p-2 hover:bg-gray-700 rounded">
          Dashboard
        </a>
        
        {/* Solo mostrar para Administradores */}
        <ShowIfRole role="Administrador">
          <a href="/admin" className="block p-2 hover:bg-gray-700 rounded">
            Administración
          </a>
        </ShowIfRole>
        
        {/* Solo mostrar para Desarrolladores */}
        <ShowIfRole role="Desarrollador">
          <a href="/dev-tools" className="block p-2 hover:bg-gray-700 rounded">
            Dev Tools
          </a>
        </ShowIfRole>
        
        {/* Solo mostrar para Gestores */}
        <ShowIfRole role="Gestor">
          <a href="/reports" className="block p-2 hover:bg-gray-700 rounded">
            Reportes
          </a>
        </ShowIfRole>
      </nav>
    </aside>
  );
}
```

---

## 👤 3. Mostrar Información del Usuario

### Ejemplo: Header con Info del Usuario

```tsx
// src/components/layout/Header.tsx
import { UserInfo } from "@/components/auth/ProtectedRoute";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function Header() {
  return (
    <header className="bg-white shadow">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">Mi Aplicación</h1>
        
        <div className="flex items-center gap-4">
          <UserInfo />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
```

### Ejemplo: Badge de Rol

```tsx
// src/app/(portal)/profile/page.tsx
import { getSessionUser } from "@/lib/auth/auth";
import { RoleBadge } from "@/components/auth/ProtectedRoute";

export default async function ProfilePage() {
  const user = await getSessionUser();
  
  if (!user) {
    return <div>No autenticado</div>;
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mi Perfil</h1>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Nombre</label>
          <p className="text-lg">{user.name}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <p className="text-lg">{user.email}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Usuario</label>
          <p className="text-lg">{user.username}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Roles</label>
          <div className="mt-1">
            <RoleBadge />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Permisos</label>
          <p className="text-sm text-gray-600">
            {user.permissions.length} permisos asignados
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-blue-600">
              Ver permisos
            </summary>
            <ul className="mt-2 space-y-1">
              {user.permissions.map((permission) => (
                <li key={permission} className="text-xs text-gray-600">
                  • {permission}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔒 4. Verificar Permisos en Server Actions

### Ejemplo: Server Action Protegida

```tsx
// src/app/actions/users.ts
"use server";

import { getSessionUser, hasPermission } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  // Verificar autenticación
  const user = await getSessionUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  
  // Verificar permiso
  if (!hasPermission(user, "users.create")) {
    throw new Error("No tienes permiso para crear usuarios");
  }
  
  // Crear usuario
  const newUser = await prisma.user.create({
    data: {
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      // ... más campos
    },
  });
  
  // Registrar en audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "USER_CREATED",
      entity: "User",
      entityId: newUser.id,
    },
  });
  
  revalidatePath("/users");
  return { success: true, user: newUser };
}

export async function deleteUser(userId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  
  if (!hasPermission(user, "users.delete")) {
    throw new Error("No tienes permiso para eliminar usuarios");
  }
  
  await prisma.user.delete({
    where: { id: userId },
  });
  
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "USER_DELETED",
      entity: "User",
      entityId: userId,
    },
  });
  
  revalidatePath("/users");
  return { success: true };
}
```

---

## 🚪 5. Botón de Logout

### Ejemplo: Botón Simple

```tsx
// src/components/layout/Header.tsx
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function Header() {
  return (
    <header>
      <LogoutButton />
    </header>
  );
}
```

### Ejemplo: Menú Dropdown con Logout

```tsx
// src/components/layout/UserMenu.tsx
"use client";

import { useState } from "react";
import { LogoutLink } from "@/components/auth/LogoutButton";

export function UserMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100"
      >
        <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium">{user.name}</span>
      </button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border">
          <a href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-100">
            Mi Perfil
          </a>
          <a href="/settings" className="block px-4 py-2 text-sm hover:bg-gray-100">
            Configuración
          </a>
          <hr className="my-1" />
          <LogoutLink />
        </div>
      )}
    </div>
  );
}
```

---

## 🔍 6. Verificar Sesión en Componentes Cliente

### Ejemplo: Componente Cliente con Sesión

```tsx
// src/components/dashboard/WelcomeCard.tsx
"use client";

import { useSession } from "next-auth/react";

export function WelcomeCard() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <div>Cargando...</div>;
  }
  
  if (!session) {
    return <div>No autenticado</div>;
  }
  
  const user = session.user as any;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold">
        ¡Bienvenido, {user.name}!
      </h2>
      <p className="text-gray-600 mt-2">
        Rol: {user.roles?.join(", ")}
      </p>
      <p className="text-sm text-gray-500 mt-1">
        {user.permissions?.length} permisos activos
      </p>
    </div>
  );
}
```

---

## 📊 7. Ejemplo Completo: Página de Dashboard

```tsx
// src/app/(portal)/dashboard/page.tsx
import { getSessionUser } from "@/lib/auth/auth";
import { ShowIfPermission, ShowIfRole } from "@/components/auth/ProtectedRoute";
import { RoleBadge } from "@/components/auth/ProtectedRoute";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getSessionUser();
  
  if (!user) {
    redirect("/login");
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-1">Bienvenido, {user.name}</p>
          </div>
          <RoleBadge />
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Usuarios</h3>
          <p className="text-3xl font-bold mt-2">1,234</p>
        </div>
        
        <ShowIfPermission permission="reports.view">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Reportes</h3>
            <p className="text-3xl font-bold mt-2">56</p>
          </div>
        </ShowIfPermission>
        
        <ShowIfRole role="Administrador">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Configuraciones</h3>
            <p className="text-3xl font-bold mt-2">12</p>
          </div>
        </ShowIfRole>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ShowIfPermission permission="users.create">
            <a
              href="/users/new"
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="mt-2 text-sm font-medium">Crear Usuario</span>
            </a>
          </ShowIfPermission>
          
          <ShowIfPermission permission="reports.view">
            <a
              href="/reports"
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="mt-2 text-sm font-medium">Ver Reportes</span>
            </a>
          </ShowIfPermission>
          
          <ShowIfRole role="Administrador">
            <a
              href="/admin"
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="mt-2 text-sm font-medium">Administración</span>
            </a>
          </ShowIfRole>
        </div>
      </div>
      
      {/* User Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Tu Información</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-600">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">Usuario</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">Roles</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.roles.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">Permisos</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.permissions.length} permisos activos</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
```

---

## 🎯 Resumen de Componentes Disponibles

| Componente | Uso | Descripción |
|------------|-----|-------------|
| `<ProtectedRoute>` | Proteger páginas completas | Requiere permiso o rol específico |
| `<ShowIfPermission>` | Mostrar/ocultar elementos | Solo muestra si tiene el permiso |
| `<ShowIfRole>` | Mostrar/ocultar elementos | Solo muestra si tiene el rol |
| `<UserInfo>` | Mostrar info del usuario | Card con datos del usuario |
| `<RoleBadge>` | Mostrar badges de roles | Badges coloridos con los roles |
| `<LogoutButton>` | Botón de logout | Botón completo con loading |
| `<LogoutIconButton>` | Botón de logout (ícono) | Solo ícono |
| `<LogoutLink>` | Link de logout | Para menús dropdown |

---

¡Usa estos ejemplos como base para implementar autenticación y autorización en tu aplicación! 🚀
