"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

type FieldType =
  | "TEXT"
  | "NUMBER"
  | "EMAIL"
  | "DATE"
  | "DATETIME"
  | "SELECT"
  | "MULTI_SELECT"
  | "CHECKBOX"
  | "RADIO"
  | "TEXTAREA"
  | "FILE"
  | "URL"
  | "PHONE";

interface Field {
  label: string;
  fieldKey: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  order: number;
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "TEXT", label: "Texto" },
  { value: "NUMBER", label: "Número" },
  { value: "EMAIL", label: "Email" },
  { value: "DATE", label: "Fecha" },
  { value: "DATETIME", label: "Fecha y Hora" },
  { value: "SELECT", label: "Selección" },
  { value: "MULTI_SELECT", label: "Selección Múltiple" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "RADIO", label: "Radio" },
  { value: "TEXTAREA", label: "Área de Texto" },
  { value: "FILE", label: "Archivo" },
  { value: "URL", label: "URL" },
  { value: "PHONE", label: "Teléfono" },
];

export default function NewFormPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);

  const createForm = trpc.forms.create.useMutation({
    onSuccess: () => {
      router.push("/forms");
    },
  });

  const addField = () => {
    setFields([
      ...fields,
      {
        label: "",
        fieldKey: "",
        type: "TEXT",
        required: false,
        order: fields.length,
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<Field>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.mutate({
      name,
      slug,
      description,
      isPublic,
      fields: fields.map((f, i) => ({ ...f, order: i })),
    });
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/forms"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Formulario</h1>
          <p className="text-sm text-gray-500">
            Crea un formulario dinámico con campos personalizados
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Información Básica
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre del Formulario *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(generateSlug(e.target.value));
                }}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Ej: Solicitud de Materiales"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="solicitud-materiales"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL: /forms/submit/{slug || "slug"}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Describe el propósito de este formulario..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Formulario público (no requiere autenticación)
              </label>
            </div>
          </div>
        </div>

        {/* Campos del formulario */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Campos</h2>
            <button
              type="button"
              onClick={addField}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              Agregar Campo
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
              <p className="text-sm text-gray-500">
                No hay campos aún. Haz clic en "Agregar Campo" para comenzar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Campo #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="text-red-600 transition-colors hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Etiqueta *
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => {
                          updateField(index, {
                            label: e.target.value,
                            fieldKey:
                              field.fieldKey || generateSlug(e.target.value),
                          });
                        }}
                        required
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
                        placeholder="Nombre del campo"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Key (identificador) *
                      </label>
                      <input
                        type="text"
                        value={field.fieldKey}
                        onChange={(e) =>
                          updateField(index, {
                            fieldKey: generateSlug(e.target.value),
                          })
                        }
                        required
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
                        placeholder="campo_nombre"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Tipo de Campo *
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(index, { type: e.target.value as FieldType })
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
                      >
                        {fieldTypes.map((ft) => (
                          <option key={ft.value} value={ft.value}>
                            {ft.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Placeholder
                      </label>
                      <input
                        type="text"
                        value={field.placeholder || ""}
                        onChange={(e) =>
                          updateField(index, { placeholder: e.target.value })
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
                        placeholder="Texto de ayuda"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Texto de Ayuda
                      </label>
                      <input
                        type="text"
                        value={field.helpText || ""}
                        onChange={(e) =>
                          updateField(index, { helpText: e.target.value })
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
                        placeholder="Descripción adicional del campo"
                      />
                    </div>

                    {(field.type === "SELECT" ||
                      field.type === "MULTI_SELECT" ||
                      field.type === "RADIO") && (
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Opciones (una por línea)
                        </label>
                        <textarea
                          value={(field.options || []).join("\n")}
                          onChange={(e) =>
                            updateField(index, {
                              options: e.target.value
                                .split("\n")
                                .filter((o) => o.trim()),
                            })
                          }
                          rows={3}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
                          placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 sm:col-span-2">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={field.required}
                        onChange={(e) =>
                          updateField(index, { required: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <label
                        htmlFor={`required-${index}`}
                        className="text-xs text-gray-700"
                      >
                        Campo obligatorio
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/forms"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createForm.isPending || !name || !slug || fields.length === 0}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {createForm.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Crear Formulario
              </>
            )}
          </button>
        </div>

        {createForm.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Error: {createForm.error.message}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
