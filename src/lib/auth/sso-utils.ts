/**
 * SSO OAuth 2.0 - Utilidades de Mapeo de Roles
 * 
 * Este archivo contiene las funciones para mapear roles del sistema SSO externo
 * a roles y permisos del sistema local.
 */

// ==========================================
// MAPEO DE ROLES SSO → ROLES LOCALES
// ==========================================

/**
 * Mapea un rol del sistema SSO a un rol del sistema local
 * 
 * EJEMPLO DE MAPEO:
 * - "Administrador" (SSO) → "Administrador" (Local)
 * - "Developer" (SSO) → "Desarrollador" (Local)
 * - "Usuario Externo" (SSO) → "Usuario" (Local)
 * 
 * @param ssoRole - Nombre del rol en el sistema SSO
 * @returns Nombre del rol en el sistema local, o null si no hay mapeo
 */
export function mapSSORole(ssoRole: string): string | null {
  // Mapeo de roles SSO a roles locales
  const roleMapping: Record<string, string> = {
    // Roles administrativos
    "Administrador": "Administrador",
    "Admin": "Administrador",
    "Administrator": "Administrador",
    
    // Roles de desarrollo
    "Developer": "Desarrollador",
    "Desarrollador": "Desarrollador",
    "Dev": "Desarrollador",
    
    // Roles de gestión
    "Manager": "Gestor",
    "Gestor": "Gestor",
    "Supervisor": "Gestor",
    
    // Roles de usuario
    "Usuario": "Usuario",
    "User": "Usuario",
    "Usuario Externo": "Usuario",
    "External User": "Usuario",
    
    // Roles de soporte
    "Support": "Soporte",
    "Soporte": "Soporte",
    "Help Desk": "Soporte",
    
    // Roles de auditoría
    "Auditor": "Auditor",
    "Audit": "Auditor",
  };

  const mappedRole = roleMapping[ssoRole];
  
  if (!mappedRole) {
    console.warn(`[SSO Utils] ⚠️ Rol SSO sin mapeo: "${ssoRole}"`);
    return null;
  }

  console.log(`[SSO Utils] 🔄 Rol mapeado: "${ssoRole}" → "${mappedRole}"`);
  return mappedRole;
}

/**
 * Mapea múltiples roles SSO a roles locales
 * 
 * @param ssoRoles - Array de roles del sistema SSO
 * @returns Array de roles locales (sin duplicados)
 */
export function mapSSORoles(ssoRoles: string[]): string[] {
  const mappedRoles = ssoRoles
    .map(mapSSORole)
    .filter((role): role is string => role !== null);

  // Eliminar duplicados
  return [...new Set(mappedRoles)];
}

// ==========================================
// VALIDACIÓN DE PERMISOS
// ==========================================

/**
 * Verifica si un rol SSO tiene permisos de administrador
 * 
 * @param ssoRole - Rol del sistema SSO
 * @returns true si es un rol administrativo
 */
export function isAdminRole(ssoRole: string): boolean {
  const adminRoles = [
    "Administrador",
    "Admin",
    "Administrator",
    "Super Admin",
    "SuperAdmin",
  ];

  return adminRoles.includes(ssoRole);
}

/**
 * Verifica si un usuario SSO tiene al menos un rol administrativo
 * 
 * @param ssoRoles - Array de roles del usuario SSO
 * @returns true si tiene al menos un rol administrativo
 */
export function hasAdminRole(ssoRoles: string[]): boolean {
  return ssoRoles.some(isAdminRole);
}

// ==========================================
// PERMISOS POR ROL
// ==========================================

/**
 * Obtiene los permisos base que debe tener un rol local
 * 
 * NOTA: Estos son permisos SUGERIDOS. Los permisos reales se obtienen
 * de la base de datos según la configuración de rolePermissions.
 * 
 * @param localRole - Nombre del rol local
 * @returns Array de claves de permisos
 */
export function getDefaultPermissionsForRole(localRole: string): string[] {
  const permissionsByRole: Record<string, string[]> = {
    "Administrador": [
      "users.view",
      "users.create",
      "users.edit",
      "users.delete",
      "roles.view",
      "roles.edit",
      "permissions.view",
      "permissions.edit",
      "audit.view",
      "settings.edit",
    ],
    
    "Desarrollador": [
      "users.view",
      "roles.view",
      "permissions.view",
      "audit.view",
      "api.access",
      "webhooks.manage",
    ],
    
    "Gestor": [
      "users.view",
      "users.edit",
      "roles.view",
      "audit.view",
      "reports.view",
    ],
    
    "Usuario": [
      "profile.view",
      "profile.edit",
      "dashboard.view",
    ],
    
    "Soporte": [
      "users.view",
      "audit.view",
      "tickets.manage",
    ],
    
    "Auditor": [
      "users.view",
      "roles.view",
      "permissions.view",
      "audit.view",
      "reports.view",
    ],
  };

  return permissionsByRole[localRole] || [];
}

// ==========================================
// VALIDACIÓN DE DATOS SSO
// ==========================================

/**
 * Valida que los datos del usuario SSO sean completos y válidos
 * 
 * @param ssoUser - Objeto con datos del usuario SSO
 * @returns Objeto con { valid: boolean, errors: string[] }
 */
export function validateSSOUser(ssoUser: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar campos obligatorios
  if (!ssoUser.id) {
    errors.push("Falta el ID del usuario");
  }

  if (!ssoUser.email) {
    errors.push("Falta el email del usuario");
  } else if (!isValidEmail(ssoUser.email)) {
    errors.push("Email inválido");
  }

  if (!ssoUser.username && !ssoUser.email) {
    errors.push("Falta username o email");
  }

  // Validar roles (opcional pero recomendado)
  if (!ssoUser.roles || !Array.isArray(ssoUser.roles)) {
    console.warn("[SSO Utils] ⚠️ Usuario SSO sin roles definidos");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ==========================================
// GENERACIÓN DE USERNAME
// ==========================================

/**
 * Genera un username válido a partir del email
 * 
 * @param email - Email del usuario
 * @returns Username generado
 */
export function generateUsernameFromEmail(email: string): string {
  // Tomar la parte antes del @
  const username = email.split("@")[0];
  
  // Limpiar caracteres especiales
  return username.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
}

// ==========================================
// LOGGING Y DEBUG
// ==========================================

/**
 * Registra información de debug del proceso SSO
 * 
 * @param ssoUser - Datos del usuario SSO
 * @param localUser - Datos del usuario local (si existe)
 */
export function logSSODebugInfo(ssoUser: any, localUser: any = null) {
  console.log("=".repeat(60));
  console.log("[SSO Debug] Información de autenticación SSO");
  console.log("=".repeat(60));
  
  console.log("\n📋 Datos SSO recibidos:");
  console.log("  - ID:", ssoUser.id);
  console.log("  - Email:", ssoUser.email);
  console.log("  - Username:", ssoUser.username || "(no proporcionado)");
  console.log("  - Name:", ssoUser.name || "(no proporcionado)");
  console.log("  - Roles SSO:", ssoUser.roles || []);
  
  if (localUser) {
    console.log("\n👤 Usuario local encontrado:");
    console.log("  - ID:", localUser.id);
    console.log("  - Email:", localUser.email);
    console.log("  - Username:", localUser.username);
    console.log("  - Roles locales:", localUser.userRoles?.map((ur: any) => ur.role.name) || []);
  } else {
    console.log("\n❌ Usuario NO encontrado en base de datos local");
  }
  
  console.log("\n🔄 Mapeo de roles:");
  if (ssoUser.roles && Array.isArray(ssoUser.roles)) {
    ssoUser.roles.forEach((role: string) => {
      const mapped = mapSSORole(role);
      console.log(`  - "${role}" → ${mapped || "(sin mapeo)"}`);
    });
  }
  
  console.log("=".repeat(60));
}
