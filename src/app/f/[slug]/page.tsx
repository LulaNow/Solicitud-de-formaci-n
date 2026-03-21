"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

interface FieldValue {
  [key: string]: string | number | boolean;
}

export default function PublicFormPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [formData, setFormData] = useState<FieldValue>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: form, isLoading, error } = trpc.forms.getBySlug.useQuery(slug);

  const handleInputChange = (fieldKey: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (form.n8nWebhookUrl) {
        const response = await fetch(form.n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: form.id,
            formName: form.name,
            formSlug: form.slug,
            submittedAt: new Date().toISOString(),
            data: formData,
          }),
        });

        if (!response.ok) {
          throw new Error("Error al enviar el formulario");
        }
      }

      setSubmitSuccess(true);
      setFormData({});
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al enviar el formulario");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Formulario no encontrado</h1>
          <p className="text-gray-600 mb-6">
            El formulario que buscas no existe o no está disponible públicamente.
          </p>
        </div>
      </div>
    );
  }

  if (!form.isPublic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
          <p className="text-gray-600 mb-6">
            Este formulario no está disponible públicamente. Por favor, contacta al administrador.
          </p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Formulario Enviado!</h1>
          <p className="text-gray-600 mb-6">
            Tu información ha sido recibida correctamente. Gracias por tu participación.
          </p>
          <button
            onClick={() => {
              setSubmitSuccess(false);
              setFormData({});
            }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Enviar otro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-white">
            <h1 className="text-3xl font-bold mb-2">{form.name}</h1>
            {form.description && (
              <p className="text-indigo-100 text-lg">{form.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {submitError && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-12 gap-x-4 gap-y-6">
              {form.fields.map((field) => {
                const colSpan = (field as any).gridColumn || 12;
                return (
                <div key={field.id} style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.helpText && (
                    <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
                  )}

                  {field.type === "TEXT" && (
                    <input
                      type="text"
                      required={field.required}
                      placeholder={field.placeholder || ""}
                      value={(formData[field.fieldKey] as string) || ""}
                      onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  )}

                  {field.type === "EMAIL" && (
                    <input
                      type="email"
                      required={field.required}
                      placeholder={field.placeholder || ""}
                      value={(formData[field.fieldKey] as string) || ""}
                      onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  )}

                  {field.type === "PHONE" && (
                    <input
                      type="tel"
                      required={field.required}
                      placeholder={field.placeholder || ""}
                      value={(formData[field.fieldKey] as string) || ""}
                      onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  )}

                  {field.type === "URL" && (
                    <input
                      type="url"
                      required={field.required}
                      placeholder={field.placeholder || ""}
                      value={(formData[field.fieldKey] as string) || ""}
                      onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  )}

                  {field.type === "NUMBER" && (
                    <input
                      type="number"
                      required={field.required}
                      placeholder={field.placeholder || ""}
                      value={(formData[field.fieldKey] as number) || ""}
                      onChange={(e) => handleInputChange(field.fieldKey, parseFloat(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  )}

                  {field.type === "TEXTAREA" && (
                    <textarea
                      required={field.required}
                      placeholder={field.placeholder || ""}
                      value={(formData[field.fieldKey] as string) || ""}
                      onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    />
                  )}

                  {field.type === "SELECT" && field.options && (
                    <select
                      required={field.required}
                      value={(formData[field.fieldKey] as string) || ""}
                      onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="">Selecciona una opción</option>
                      {(field.options as string[]).map((opt: string, i: number) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === "MULTI_SELECT" && field.options && (
                    <select
                      multiple
                      required={field.required}
                      value={formData[field.fieldKey] ? String(formData[field.fieldKey]).split(",") : []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (o) => o.value).join(",");
                        handleInputChange(field.fieldKey, selected);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-h-[100px]"
                    >
                      {(field.options as string[]).map((opt: string, i: number) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === "RADIO" && field.options && (
                    <div className="space-y-2">
                      {(field.options as string[]).map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={field.fieldKey}
                            value={opt}
                            checked={formData[field.fieldKey] === opt}
                            onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === "CHECKBOX" && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        required={field.required}
                        checked={(formData[field.fieldKey] as boolean) || false}
                        onChange={(e) => handleInputChange(field.fieldKey, e.target.checked)}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-sm text-gray-600">{field.placeholder}</span>
                    </div>
                  )}

                  {field.type === "DATE" && (
                    <input
                      type="date"
                      required={field.required}
                      value={(formData[field.fieldKey] as string) || ""}
                      onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  )}

                  {field.type === "DATETIME" && (
                    <input
                      type="datetime-local"
                      required={field.required}
                      value={(formData[field.fieldKey] as string) || ""}
                      onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  )}

                  {field.type === "FILE" && (
                    <input
                      type="file"
                      required={field.required}
                      onChange={(e) => handleInputChange(field.fieldKey, e.target.files?.[0]?.name || "")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  )}
                </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? "Enviando..." : "Enviar Formulario"}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Formulario público • MDM Materiales</p>
        </div>
      </div>
    </div>
  );
}
