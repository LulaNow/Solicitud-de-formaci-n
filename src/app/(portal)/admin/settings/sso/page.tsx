"use client";

import { trpc } from "@/lib/trpc/client";
import { useState, useEffect } from "react";
import {
  Globe,
  Key,
  Link2,
  Save,
  Check,
  AlertCircle,
  Shield,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Copy,
  ArrowLeft,
  UserPlus,
  Users,
  Info,
} from "lucide-react";
import Link from "next/link";

function Toggle({
  enabled,
  onChange,
  activeColor = "bg-brand-500",
}: {
  enabled: boolean;
  onChange: () => void;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        enabled ? activeColor : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SSOSettingsPage() {
  const { data: config, isLoading } = trpc.sso.getConfig.useQuery();
  const { data: roles } = trpc.sso.getAvailableRoles.useQuery();
  const saveMutation = trpc.sso.saveConfig.useMutation({
    onSuccess: (_, variables) => {
      // Actualizar hasClientSecret localmente si se envió un nuevo secret
      if (variables.clientSecret) {
        setHasSecret(true);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });
  const testMutation = trpc.sso.testConnection.useMutation();

  const [initialized, setInitialized] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [appstoreUrl, setAppstoreUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [callbackPath, setCallbackPath] = useState("/api/auth/sso/callback");
  const [autoCreateUsers, setAutoCreateUsers] = useState(false);
  const [defaultRoleOnCreate, setDefaultRoleOnCreate] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [hasSecret, setHasSecret] = useState(false);

  // Solo inicializar el formulario UNA VEZ cuando llegan los datos de la DB
  useEffect(() => {
    if (!config || initialized) return;
    setEnabled(config.enabled);
    setAppstoreUrl(config.appstoreUrl);
    setClientId(config.clientId);
    setCallbackPath(config.callbackPath || "/api/auth/sso/callback");
    setAutoCreateUsers(config.autoCreateUsers);
    setDefaultRoleOnCreate(config.defaultRoleOnCreate);
    setHasSecret(config.hasClientSecret);
    setInitialized(true);
  }, [config, initialized]);

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleSave() {
    const trimmedUrl = appstoreUrl.replace(/\/$/, "");
    const trimmedId = clientId.trim();
    const trimmedSecret = clientSecret.trim();

    // Actualizar state local para que la UI refleje los valores limpios
    setAppstoreUrl(trimmedUrl);
    setClientId(trimmedId);

    await saveMutation.mutateAsync({
      enabled,
      appstoreUrl: trimmedUrl,
      clientId: trimmedId,
      clientSecret: trimmedSecret || undefined,
      callbackPath,
      autoCreateUsers,
      defaultRoleOnCreate,
    });

    // Limpiar el campo secret después de guardar exitosamente
    if (trimmedSecret) {
      setClientSecret("");
    }
  }

  async function handleTestConnection() {
    // Usa los datos del formulario directamente, no necesita guardar primero
    await testMutation.mutateAsync({
      appstoreUrl: appstoreUrl.replace(/\/$/, ""),
      clientId: clientId.trim(),
    });
  }

  // Construir la callback URL completa para mostrar al admin
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fullCallbackUrl = `${appUrl}${callbackPath}`;

  // Construir la URL de autorización de ejemplo
  const authorizationUrl = appstoreUrl
    ? `${appstoreUrl}/api/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(fullCallbackUrl)}&response_type=code&state=RANDOM_STATE`
    : "";

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/settings"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Configuración
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Configuración SSO (Single Sign-On)
        </h1>
        <p className="text-sm text-gray-500">
          Configura la conexión OAuth 2.0 con el AppStore de NADRO para autenticación centralizada
        </p>
      </div>

      {/* SSO Enable/Disable */}
      <div className="mb-6 rounded-lg border border-border bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                enabled ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <Shield
                className={`h-5 w-5 ${enabled ? "text-green-600" : "text-gray-400"}`}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {enabled ? "SSO Habilitado" : "SSO Deshabilitado"}
              </h2>
              <p className="text-sm text-gray-500">
                {enabled
                  ? "Los usuarios pueden iniciar sesión desde el AppStore"
                  : "Solo se permite login local con usuario/contraseña"}
              </p>
            </div>
          </div>
          <Toggle
            enabled={enabled}
            onChange={() => setEnabled(!enabled)}
            activeColor="bg-green-500"
          />
        </div>
      </div>

      {/* AppStore Connection */}
      <div className="mb-6 rounded-lg border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Conexión con AppStore
          </h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Datos proporcionados al registrar este portal en el AppStore de NADRO
        </p>

        <div className="space-y-4">
          {/* AppStore URL */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              URL del AppStore
            </label>
            <input
              type="url"
              value={appstoreUrl}
              onChange={(e) => setAppstoreUrl(e.target.value)}
              placeholder="https://appstore.nadro.dev"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
            <p className="mt-1 text-xs text-gray-400">
              URL base del AppStore, sin / al final
            </p>
          </div>

          {/* Client ID */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Client ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="4a2c0f09-687c-4908-a59d-893417e07a71"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                onClick={() => handleCopy(clientId, "clientId")}
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-gray-500 hover:bg-gray-50"
                title="Copiar"
              >
                {copied === "clientId" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Se obtiene al crear el portal en el AppStore (Admin → Portales → Nuevo Portal)
            </p>
          </div>

          {/* Client Secret */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Client Secret
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showSecret ? "text" : "password"}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder={
                    hasSecret
                      ? "••••••••  (ya configurado — dejar vacío para mantener)"
                      : "nsk_DwyerofstbUNnGCTfQjdUbpYE0aPhhfD3YlBqjjdIVY"
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {hasSecret && (
              <p className="mt-1 text-xs text-green-600">
                ✅ Secret configurado y encriptado. Deja vacío para mantener el actual.
              </p>
            )}
            {!hasSecret && (
              <p className="mt-1 text-xs text-amber-600">
                ⚠️ Sin secret configurado. Se muestra UNA SOLA VEZ al crear el portal en el AppStore.
              </p>
            )}
          </div>
        </div>

        {/* Test Connection Button */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleTestConnection}
            disabled={!appstoreUrl || testMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
          >
            {testMutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            Probar Conexión
          </button>
          {testMutation.data && (
            <span
              className={`text-sm ${
                testMutation.data.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {testMutation.data.message}
            </span>
          )}
        </div>
      </div>

      {/* Callback URL */}
      <div className="mb-6 rounded-lg border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Callback URL
          </h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Esta es la URL que debes registrar en el AppStore como &quot;Callback URL&quot; de tu portal
        </p>

        {/* Callback Path */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ruta del Callback
          </label>
          <input
            type="text"
            value={callbackPath}
            onChange={(e) => setCallbackPath(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Full Callback URL (read-only, copiable) */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <label className="mb-2 block text-sm font-medium text-purple-800">
            URL Completa del Callback
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white px-3 py-2 font-mono text-sm text-gray-800 border border-purple-200">
              {fullCallbackUrl}
            </code>
            <button
              onClick={() => handleCopy(fullCallbackUrl, "callback")}
              className="rounded-lg border border-purple-300 bg-white px-3 py-2 text-purple-600 hover:bg-purple-50"
            >
              {copied === "callback" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-purple-600">
            📋 Copia esta URL y regístrala en el AppStore al crear/editar tu portal
          </p>
        </div>
      </div>

      {/* Auto Create Users */}
      <div className="mb-6 rounded-lg border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Creación Automática de Usuarios
          </h2>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-lg border-2 border-dashed border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-amber-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                Auto-crear usuarios al login SSO
              </div>
              <div className="text-xs text-gray-500">
                Si un usuario no existe localmente, se crea automáticamente con datos del AppStore
              </div>
            </div>
          </div>
          <Toggle
            enabled={autoCreateUsers}
            onChange={() => setAutoCreateUsers(!autoCreateUsers)}
            activeColor="bg-amber-500"
          />
        </div>

        {autoCreateUsers && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Rol por defecto para usuarios auto-creados
            </label>
            <select
              value={defaultRoleOnCreate}
              onChange={(e) => setDefaultRoleOnCreate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">— Sin rol por defecto —</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Rol que se asignará automáticamente a usuarios creados por SSO
            </p>
          </div>
        )}

        {!autoCreateUsers && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex gap-2">
              <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              <p className="text-xs text-blue-700">
                Con esta opción deshabilitada, solo podrán iniciar sesión por SSO los usuarios que ya existan en la base de datos local de este portal. Si un usuario del AppStore intenta acceder y no existe aquí, verá un error.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Endpoints Reference */}
      <div className="mb-6 rounded-lg border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Endpoints del SSO (Referencia)
          </h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Estos endpoints se construyen automáticamente a partir de la URL del AppStore
        </p>

        <div className="space-y-3">
          {[
            {
              label: "Authorization",
              path: "/api/oauth/authorize",
              desc: "Redirige al usuario para autorizar",
            },
            {
              label: "Token Exchange",
              path: "/api/trpc/apps.exchangeToken",
              desc: "Intercambia el code por un token",
            },
            {
              label: "User Info",
              path: "/api/oauth/userinfo",
              desc: "Obtiene datos del usuario autenticado",
            },
          ].map((ep) => (
            <div
              key={ep.label}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">{ep.label}</div>
                <div className="text-xs text-gray-500">{ep.desc}</div>
              </div>
              <code className="rounded bg-white px-2 py-1 font-mono text-xs text-gray-600 border border-gray-200">
                {appstoreUrl ? `${appstoreUrl}${ep.path}` : ep.path}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Flow Diagram */}
      {enabled && appstoreUrl && clientId && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-green-800">
            ✅ Flujo SSO Configurado
          </h3>
          <ol className="space-y-1 text-xs text-green-700 list-decimal list-inside">
            <li>El usuario hace clic en &quot;Login con SSO&quot; en la página de login</li>
            <li>
              Se redirige al AppStore:{" "}
              <code className="bg-white px-1 rounded text-[10px]">
                {appstoreUrl}/api/oauth/authorize
              </code>
            </li>
            <li>El usuario se autentica en el AppStore</li>
            <li>
              El AppStore redirige de vuelta a:{" "}
              <code className="bg-white px-1 rounded text-[10px]">{fullCallbackUrl}?code=XXX</code>
            </li>
            <li>Este portal intercambia el código por un token con el AppStore</li>
            <li>Se busca/crea el usuario en la base de datos local</li>
            <li>Se crea la sesión y se redirige al dashboard</li>
          </ol>
        </div>
      )}

      {/* Save Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-brand-600 hover:shadow-xl disabled:opacity-50"
        >
          {saved ? (
            <Check className="h-5 w-5" />
          ) : saveMutation.isPending ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          <span className="hidden sm:inline">
            {saved ? "Guardado" : saveMutation.isPending ? "Guardando..." : "Guardar SSO"}
          </span>
        </button>
      </div>
    </div>
  );
}
