"use client";

import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { Shield, ShieldCheck, ShieldOff, QrCode, Copy, Check } from "lucide-react";
import Image from "next/image";

export default function MfaSettingsPage() {
  const [token, setToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [showDisable, setShowDisable] = useState(false);

  const { data: status, refetch } = trpc.mfa.status.useQuery();
  const setupMfa = trpc.mfa.setup.useMutation({ onError: (err) => setError(err.message) });
  const verifyMfa = trpc.mfa.verify.useMutation({
    onSuccess: () => { refetch(); setToken(""); setError(""); },
    onError: (err) => setError(err.message),
  });
  const disableMfa = trpc.mfa.disable.useMutation({
    onSuccess: () => { refetch(); setDisableToken(""); setShowDisable(false); setError(""); },
    onError: (err) => setError(err.message),
  });

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Autenticación Multi-Factor (MFA)</h1>
        <p className="text-sm text-gray-500">Protege tu cuenta con verificación en dos pasos</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${status?.verified ? "bg-green-100" : status?.enabled ? "bg-amber-100" : "bg-gray-100"}`}>
            {status?.verified ? <ShieldCheck className="h-6 w-6 text-green-600" /> : <Shield className="h-6 w-6 text-gray-400" />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {status?.verified ? "MFA Activo" : status?.enabled ? "MFA Pendiente de Verificación" : "MFA Desactivado"}
            </h2>
            <p className="text-sm text-gray-500">
              {status?.verified
                ? `Bypass restantes: ${status.bypassRemaining}/3`
                : "Habilita MFA para mayor seguridad"}
            </p>
          </div>
        </div>

        {!status?.enabled && !setupMfa.data && (
          <button
            onClick={() => setupMfa.mutate()}
            disabled={setupMfa.isPending}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md disabled:opacity-50"
          >
            <QrCode className="h-4 w-4" />
            {setupMfa.isPending ? "Generando..." : "Activar MFA"}
          </button>
        )}

        {setupMfa.data && !status?.verified && (
          <div className="space-y-6">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-blue-800">Paso 1: Escanea el código QR</h3>
              <p className="mb-4 text-xs text-blue-600">Usa una app como Google Authenticator, Authy o Microsoft Authenticator</p>
              <div className="flex justify-center">
                <Image src={setupMfa.data.qrCode} alt="QR Code MFA" width={200} height={200} className="rounded-lg" />
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Clave manual</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-sm text-gray-800">{setupMfa.data.secret}</code>
                <button
                  onClick={() => handleCopy(setupMfa.data!.secret)}
                  className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-white"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Paso 2: Ingresa el código de 6 dígitos</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  className="w-40 rounded-lg border border-gray-300 px-4 py-2.5 text-center font-mono text-lg tracking-widest outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="000000"
                />
                <button
                  onClick={() => verifyMfa.mutate({ token })}
                  disabled={token.length !== 6 || verifyMfa.isPending}
                  className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {verifyMfa.isPending ? "Verificando..." : "Verificar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {status?.verified && (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-100 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">MFA está activado y verificado</span>
              </div>
              <p className="mt-1 text-xs text-green-600">
                Tienes {status.bypassRemaining} bypass restantes de 3. Un admin puede resetear tu contador.
              </p>
            </div>

            {!showDisable ? (
              <button
                onClick={() => setShowDisable(true)}
                className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <ShieldOff className="h-4 w-4" />
                Desactivar MFA
              </button>
            ) : (
              <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                <p className="mb-3 text-sm text-red-700">Ingresa un código de tu app para confirmar la desactivación:</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    value={disableToken}
                    onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ""))}
                    className="w-40 rounded-lg border border-gray-300 px-4 py-2.5 text-center font-mono text-lg tracking-widest outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    placeholder="000000"
                  />
                  <button
                    onClick={() => disableMfa.mutate({ token: disableToken })}
                    disabled={disableToken.length !== 6 || disableMfa.isPending}
                    className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => { setShowDisable(false); setDisableToken(""); }}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {status?.portalMfaRequired && !status.verified && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <strong>⚠ Atención:</strong> El administrador ha habilitado MFA obligatorio para el portal. Configura tu MFA para continuar usando el sistema.
        </div>
      )}
    </div>
  );
}
